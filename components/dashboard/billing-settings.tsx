"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, Sparkles, Crown } from "lucide-react";
import { SUBSCRIPTION_TIERS, formatLimit } from "@/lib/subscription/config";

interface BillingSettingsProps {
  profile: Profile | null;
}

export function BillingSettings({ profile }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const isPro = profile?.subscription_tier === "pro";
  const tierLimits = isPro ? SUBSCRIPTION_TIERS.pro : SUBSCRIPTION_TIERS.free;
  const wordsUsed = profile?.words_used_this_month || 0;
  const wordLimit = tierLimits.monthlyWordQuota || Infinity;
  const wordProgress = wordLimit === Infinity ? 0 : (wordsUsed / wordLimit) * 100;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setIsPortalLoading(false);
    }
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
                  ? "You have access to all Pro features"
                  : "Upgrade to unlock unlimited features"}
              </CardDescription>
            </div>
            <Badge variant={isPro ? "default" : "secondary"} className="text-lg px-4 py-1">
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Word Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AI Words Generated This Month</span>
              <span>
                {wordsUsed.toLocaleString()} / {formatLimit(tierLimits.monthlyWordQuota)}
              </span>
            </div>
            {tierLimits.monthlyWordQuota && (
              <Progress value={wordProgress} className="h-2" />
            )}
            {wordProgress >= 100 && (
              <p className="text-sm text-destructive">
                You&apos;ve reached your monthly limit. {!isPro && "Upgrade to Pro for more words."}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {isPro ? (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isPortalLoading}
            >
              {isPortalLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Manage Billing
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro - $15/month
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Plan Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card className={!isPro ? "border-primary" : ""}>
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
                {formatLimit(SUBSCRIPTION_TIERS.free.monthlyWordQuota)} AI words/month
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                TXT export
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={isPro ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Pro</CardTitle>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                Popular
              </Badge>
            </div>
            <CardDescription>For serious writers</CardDescription>
            <p className="text-3xl font-bold">
              $15<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {formatLimit(SUBSCRIPTION_TIERS.pro.maxProjects)} projects
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {formatLimit(SUBSCRIPTION_TIERS.pro.maxBooksPerProject)} books
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {formatLimit(SUBSCRIPTION_TIERS.pro.maxStoryNodes)} story elements
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {formatLimit(SUBSCRIPTION_TIERS.pro.monthlyWordQuota)} AI words/month
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                TXT export
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Priority support
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {!isPro && (
              <Button className="w-full" onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Upgrade Now
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
