"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/analytics/events";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

interface TrackedFAQAccordionProps {
  items: FAQItem[];
}

export function TrackedFAQAccordion({ items }: TrackedFAQAccordionProps) {
  const handleValueChange = (value: string) => {
    if (value) {
      const index = parseInt(value.replace("item-", ""), 10);
      if (!isNaN(index) && items[index]) {
        trackEvent.faqOpened(items[index].question);
      }
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full" onValueChange={handleValueChange}>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.answer}
            {item.question.includes("cost") && (
              <Link href="/pricing" className="ml-1 text-primary hover:underline">
                See pricing page
              </Link>
            )}
            {item.question.includes("private") && (
              <Link href="/privacy" className="ml-1 text-primary hover:underline">
                Read our privacy policy
              </Link>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
