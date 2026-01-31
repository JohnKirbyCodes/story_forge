import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { logger } from "@/lib/logger";
import { checkApiRateLimit, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  // Rate limit webhook requests (by IP, since webhooks are unauthenticated)
  const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.STRIPE_WEBHOOK, { request });
  if (rateLimited) {
    return createRateLimitResponse();
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.warn("Webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription as string)
          : null;
        const userId = subscription?.metadata.supabase_user_id || session.metadata?.supabase_user_id;
        const billingCycle = subscription?.metadata.billing_cycle || "monthly";

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "pro",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              billing_cycle: billingCycle,
            })
            .eq("id", userId);

          logger.info("User upgraded to Pro", { event: "checkout.session.completed", billingCycle });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          const isActive = ["active", "trialing"].includes(subscription.status);
          const tier = isActive ? "pro" : "free";
          const billingCycle = subscription.metadata.billing_cycle || "monthly";

          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              subscription_status: subscription.status,
              billing_cycle: billingCycle,
            })
            .eq("id", userId);

          logger.info("Subscription updated", { tier, status: subscription.status, billingCycle });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              subscription_status: "canceled",
            })
            .eq("id", userId);

          logger.info("Subscription canceled", { event: "customer.subscription.deleted" });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = (invoice as { subscription?: string | null }).subscription;
        if (subscriptionId) {
          await stripe.subscriptions.retrieve(subscriptionId);
          logger.debug("Payment succeeded", { event: "invoice.payment_succeeded" });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = (invoice as { subscription?: string | null }).subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata.supabase_user_id;

          if (userId) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "past_due",
              })
              .eq("id", userId);

            logger.warn("Payment failed, subscription marked as past_due");
          }
        }
        break;
      }

      default:
        logger.debug("Unhandled webhook event", { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing failed", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
