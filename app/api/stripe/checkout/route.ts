import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { BillingCycle } from "@/lib/subscription/config";
import { checkApiRateLimit, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    // Parse request body for billing cycle
    const body = await request.json().catch(() => ({}));
    const billingCycle: BillingCycle = body.billingCycle === "annual" ? "annual" : "monthly";

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit checkout requests to prevent fraud
    const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.STRIPE_CHECKOUT, {
      request,
      rateLimitKey: user.id,
    });
    if (rateLimited) {
      return createRateLimitResponse();
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Select price ID based on billing cycle
    const priceId = billingCycle === "annual"
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID!
      : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID!;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          billing_cycle: billingCycle,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
