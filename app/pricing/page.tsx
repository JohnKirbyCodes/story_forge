import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { PricingSection } from "@/components/shared/pricing-section";
import { Check, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const pricingFaq = [
  {
    question: "Do I need to provide my own API key?",
    answer: "Yes. NovelWorld uses a Bring Your Own Key (BYOK) model. You connect your OpenAI API key in Settings, and you pay OpenAI directly for token usage. This keeps our subscription costs low and gives you full control over your AI spending."
  },
  {
    question: "What counts as a 'story element'?",
    answer: "Story elements are the building blocks of your knowledge graph: characters, locations, events, items, concepts, and factions. On the Free tier, you can create up to 15 total. Pro gives you unlimited."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes. You can upgrade to Pro anytime and get immediate access to all features. If you downgrade, you'll keep Pro features until the end of your billing period. Your content is never deleted."
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "We don't offer a traditional trial, but our Free tier lets you experience the full product with limited capacity. When you're ready for more, upgrade to Pro."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards through Stripe. Your payment information is securely processed and never touches our servers."
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 7-day money-back guarantee on Pro subscriptions. If you're not satisfied, contact us within 7 days of your purchase for a full refund."
  }
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold font-serif">NovelWorld</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm text-foreground font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Start free. Upgrade when you need more capacity.
              Bring your own API key and only pay for what you use.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <PricingSection />

        {/* Feature Comparison */}
        <section className="border-t bg-card py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                Compare Plans
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-3xl overflow-x-auto">
              <table className="w-full border-collapse rounded-lg border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-4 text-left font-semibold">Feature</th>
                    <th className="border p-4 text-center font-semibold">Free</th>
                    <th className="border p-4 text-center font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-4">Projects</td>
                    <td className="border p-4 text-center">1</td>
                    <td className="border p-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-4">Books per project</td>
                    <td className="border p-4 text-center">1</td>
                    <td className="border p-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border p-4">Story elements (nodes)</td>
                    <td className="border p-4 text-center">15</td>
                    <td className="border p-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-4">Chapters & scenes</td>
                    <td className="border p-4 text-center">Unlimited</td>
                    <td className="border p-4 text-center">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="border p-4">Word count</td>
                    <td className="border p-4 text-center">Unlimited</td>
                    <td className="border p-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-4">AI scene generation</td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-4">Knowledge graph</td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-4">Export to TXT</td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-4">Export to DOCX & EPUB</td>
                    <td className="border p-4 text-center text-muted-foreground">-</td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="border p-4">Priority support</td>
                    <td className="border p-4 text-center text-muted-foreground">-</td>
                    <td className="border p-4 text-center">
                      <Check className="inline h-4 w-4 text-green-600" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* BYOK Explainer */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-4 rounded-xl border bg-card p-6">
                <HelpCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold">About Bring Your Own Key (BYOK)</h3>
                  <p className="mt-2 text-muted-foreground">
                    NovelWorld uses a BYOK model for AI features. You provide your own OpenAI API key
                    and pay OpenAI directly for token usage. This means:
                  </p>
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span>Lower subscription costs for you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span>Full control over your AI spending</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span>Access to the latest OpenAI models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                      <span>No hidden AI usage fees from us</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Typical usage costs $5-20/month on OpenAI depending on how much you write.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing FAQ */}
        <section className="border-t bg-card py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                Pricing FAQ
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {pricingFaq.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Ready to Build Your Story World?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Start free today. No credit card required.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-base">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
