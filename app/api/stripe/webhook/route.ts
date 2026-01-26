import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription/config";

export async function POST(request: Request) {
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
    console.error("Webhook signature verification failed:", err);
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
        const userId = session.subscription
          ? (
              await stripe.subscriptions.retrieve(session.subscription as string)
            ).metadata.supabase_user_id
          : session.metadata?.supabase_user_id;

        if (userId) {
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await supabase
            .from("profiles")
            .update({
              subscription_tier: "pro",
              stripe_customer_id: session.customer as string,
              words_quota: SUBSCRIPTION_TIERS.pro.monthlyWordQuota,
              words_used_this_month: 0,
              billing_period_start: now.toISOString().split("T")[0],
              billing_period_end: nextMonth.toISOString().split("T")[0],
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          const isActive = ["active", "trialing"].includes(subscription.status);
          const tier = isActive ? "pro" : "free";
          const tierConfig = SUBSCRIPTION_TIERS[tier];

          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              words_quota: tierConfig.monthlyWordQuota,
            })
            .eq("id", userId);
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
              words_quota: SUBSCRIPTION_TIERS.free.monthlyWordQuota,
            })
            .eq("id", userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = (invoice as { subscription?: string | null }).subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata.supabase_user_id;

          if (userId) {
            // Reset monthly word count quota and update billing period
            const now = new Date();
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            await supabase
              .from("profiles")
              .update({
                words_used_this_month: 0,
                billing_period_start: now.toISOString().split("T")[0],
                billing_period_end: nextMonth.toISOString().split("T")[0],
              })
              .eq("id", userId);

            console.log(`Reset word usage for user ${userId}, new billing period: ${now.toISOString().split("T")[0]} to ${nextMonth.toISOString().split("T")[0]}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
