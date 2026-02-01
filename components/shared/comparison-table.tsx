"use client";

import { useEffect, useRef } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

export function ComparisonTable() {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            trackEvent.comparisonViewed();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mx-auto mt-16 max-w-4xl overflow-x-auto">
      <table className="w-full border-collapse rounded-lg border">
        <thead>
          <tr className="bg-muted/50">
            <th className="border p-4 text-left font-semibold">Feature</th>
            <th className="border p-4 text-center font-semibold">NovelWorld</th>
            <th className="border p-4 text-center font-semibold">ChatGPT/Generic AI</th>
            <th className="border p-4 text-center font-semibold">Other AI Writing Tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-4">Story Context Memory</td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Full story world model
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-red-500">
                <X className="h-4 w-4" /> Session-only
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" /> Limited
              </span>
            </td>
          </tr>
          <tr className="bg-muted/30">
            <td className="border p-4">Character Consistency</td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Enforced across draft
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-red-500">
                <X className="h-4 w-4" /> None
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" /> Limited
              </span>
            </td>
          </tr>
          <tr>
            <td className="border p-4">Relationship Mapping</td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Visual knowledge graph
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-red-500">
                <X className="h-4 w-4" /> Not available
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-red-500">
                <X className="h-4 w-4" /> Not available
              </span>
            </td>
          </tr>
          <tr className="bg-muted/30">
            <td className="border p-4">Plot Dependency Detection</td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Intelligent connections
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-red-500">
                <X className="h-4 w-4" /> None
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" /> Limited
              </span>
            </td>
          </tr>
          <tr>
            <td className="border p-4">Pricing</td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Free tier available
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" /> Free tier available
              </span>
            </td>
            <td className="border p-4 text-center">
              <span className="inline-flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" /> $20+/month
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
