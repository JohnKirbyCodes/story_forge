"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { getProPricing, BillingCycle } from "@/lib/subscription/config";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("annual");
  const pricing = getProPricing();

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
            Pricing
          </p>
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            Start Free, Scale When Ready
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            No credit card required. Upgrade when you need more.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mt-10">
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

        <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Perfect for getting started</p>
            <ul className="mt-8 space-y-4">
              {["1 project", "1 book", "15 story elements", "Bring Your Own API Key", "Export to TXT"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 block">
              <Button variant="outline" className="w-full">Start Free</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold">Pro</h3>
            <div className="mt-4">
              {selectedCycle === "annual" ? (
                <>
                  <span className="text-4xl font-bold">${pricing.annualMonthly}</span>
                  <span className="text-muted-foreground">/month</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ${pricing.annual} billed annually
                  </p>
                  <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <Zap className="mr-1 h-3 w-3" />
                    Save ${pricing.annualSavings}/year vs monthly
                  </Badge>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">${pricing.monthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">For serious writers</p>
            <ul className="mt-8 space-y-4">
              {[
                "Unlimited projects",
                "Unlimited books",
                "Unlimited story elements",
                "Bring Your Own API Key",
                "Export to TXT",
                "Priority support"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 block">
              <Button className="w-full">
                {selectedCycle === "annual"
                  ? `Go Pro - $${pricing.annual}/year`
                  : `Go Pro - $${pricing.monthly}/month`
                }
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
