"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, Crown, Key, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS, formatLimit, getProPricing, BillingCycle } from "@/lib/subscription/config";
import { cn } from "@/lib/utils";

interface BillingSettingsProps {
  profile: Profile | null;
}

export function BillingSettings({ profile }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("annual");
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const isPro = profile?.subscription_tier === "pro";
  const hasApiKey = profile?.ai_api_key_valid === true;
  const currentBillingCycle = (profile?.billing_cycle as BillingCycle) || "monthly";
  const pricing = getProPricing();

  const handleUpgrade = async (cycle: BillingCycle) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle: cycle }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout",
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = () => {
    // Direct link to Stripe Customer Portal
    window.location.href = "https://billing.stripe.com/p/login/7sYcN7d5N5Qg3oibzU6EU00";
  };

  return (
    <div className="space-y-6">
      {/* Success/Cancel Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 py-4">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-green-700 dark:text-green-300">
              Your subscription has been activated! Welcome to Pro.
            </p>
          </CardContent>
        </Card>
      )}
      {canceled && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-3 py-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Checkout was canceled. No charges were made.
            </p>
          </CardContent>
        </Card>
      )}

      {/* API Key Status Alert */}
      {!hasApiKey && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">
                  AI API Key Required
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Configure your own API key to use AI features (Anthropic, OpenAI, or Google).
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings/ai">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {isPro && <Crown className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? `You have access to all Pro features (${currentBillingCycle === "annual" ? "Annual" : "Monthly"} billing)`
                  : "Upgrade to unlock unlimited features"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isPro && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  {currentBillingCycle === "annual" ? "Yearly" : "Monthly"}
                </Badge>
              )}
              <Badge variant={isPro ? "default" : "secondary"} className="text-lg px-4 py-1">
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current limits display */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Series:</span>{" "}
              <span className="font-medium">
                {formatLimit(isPro ? SUBSCRIPTION_TIERS.pro.maxProjects : SUBSCRIPTION_TIERS.free.maxProjects)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Books per series:</span>{" "}
              <span className="font-medium">
                {formatLimit(isPro ? SUBSCRIPTION_TIERS.pro.maxBooksPerProject : SUBSCRIPTION_TIERS.free.maxBooksPerProject)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Story elements:</span>{" "}
              <span className="font-medium">
                {formatLimit(isPro ? SUBSCRIPTION_TIERS.pro.maxStoryNodes : SUBSCRIPTION_TIERS.free.maxStoryNodes)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">AI Provider:</span>{" "}
              <span className="font-medium">
                {hasApiKey ? (profile?.ai_provider || "Configured") : "Not configured"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {isPro ? (
            <Button
              variant="outline"
              onClick={handleManageBilling}
            >
              Manage Billing
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Upgrade Section - Only show for free users */}
      {!isPro && (
        <>
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-lg border bg-muted p-1">
              <button
                onClick={() => setSelectedCycle("monthly")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  selectedCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedCycle("annual")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors relative",
                  selectedCycle === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-[10px] px-1.5 py-0.5">
                  Save ${pricing.annualSavings}
                </Badge>
              </button>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>For getting started</CardDescription>
                <p className="text-3xl font-bold">$0</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.free.maxProjects)} project
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.free.maxBooksPerProject)} book per project
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.free.maxStoryNodes)} story elements
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Bring Your Own API Key (BYOK)
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    TXT export
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Badge variant="outline" className="w-full justify-center py-2">
                  Current Plan
                </Badge>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                Recommended
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Pro</CardTitle>
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
                <CardDescription>For serious writers</CardDescription>
                <div className="space-y-1">
                  {selectedCycle === "annual" ? (
                    <>
                      <p className="text-3xl font-bold">
                        ${pricing.annualMonthly}
                        <span className="text-base font-normal text-muted-foreground">/month</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${pricing.annual} billed annually
                      </p>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Zap className="mr-1 h-3 w-3" />
                        Save ${pricing.annualSavings}/year
                      </Badge>
                    </>
                  ) : (
                    <p className="text-3xl font-bold">
                      ${pricing.monthly}
                      <span className="text-base font-normal text-muted-foreground">/month</span>
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.pro.maxProjects)} projects
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.pro.maxBooksPerProject)} books per project
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {formatLimit(SUBSCRIPTION_TIERS.pro.maxStoryNodes)} story elements
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Bring Your Own API Key (BYOK)
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Export to TXT
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(selectedCycle)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {selectedCycle === "annual"
                    ? `Upgrade to Pro - $${pricing.annual}/year`
                    : `Upgrade to Pro - $${pricing.monthly}/month`
                  }
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}

      {/* BYOK Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Bring Your Own Key (BYOK)
          </CardTitle>
          <CardDescription>
            Use your own AI provider API keys for unlimited AI generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            NovelWorld uses a BYOK model - you provide your own API key from your preferred AI provider
            (Anthropic Claude, OpenAI GPT-4, or Google Gemini). This means:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>No AI usage limits</strong> - generate as much as your API key allows</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Pay-as-you-go</strong> - only pay for what you use directly to the provider</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Choose your provider</strong> - use Claude, GPT-4, or Gemini based on your preference</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span><strong>Secure storage</strong> - your API key is encrypted and never shared</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link href="/dashboard/settings/ai">
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Configure AI Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
