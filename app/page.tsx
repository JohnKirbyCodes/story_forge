import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { PricingSection } from "@/components/shared/pricing-section";
import {
  Network,
  Sparkles,
  Zap,
  PenLine,
  Brain,
  Target,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Star,
  Globe,
  Quote,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How is NovelWorld different from ChatGPT?",
    answer: "ChatGPT forgets your story between conversations. NovelWorld learns your entire world and feeds that context into every suggestion. You get AI that knows your characters, your plot, your rules. ChatGPT starts from scratch each time."
  },
  {
    question: "Can I use NovelWorld for non-fiction?",
    answer: "NovelWorld is optimized for fiction and narrative storytelling. The knowledge graph works best when you have characters, locations, and relationships. For non-fiction, traditional tools like Google Docs work fine."
  },
  {
    question: "How much does NovelWorld cost?",
    answer: "NovelWorld has a free tier with unlimited world-building and limited AI suggestions. Pro tier ($15/month) includes unlimited AI drafting and full revision tools. See our pricing page for details."
  },
  {
    question: "Is my story private?",
    answer: "Yes. Your manuscript is encrypted at rest and in transit. Only you and your invited collaborators can access it. We never use your story for training data."
  },
  {
    question: "Can I import my existing manuscript?",
    answer: "Yes. NovelWorld accepts .docx, .txt, and .md files. It analyzes your manuscript and automatically extracts characters, locations, and events to build your initial knowledge graph. You refine from there."
  },
  {
    question: "How does the AI avoid repetitive suggestions?",
    answer: "NovelWorld's AI learns from what you accept and reject. It remembers your style, preferences, and story rules. The more you use it, the more personalized it becomes. It's not one-size-fits-all."
  },
  {
    question: "Can I collaborate with other writers?",
    answer: "Yes. You can invite co-authors to your project. You can assign separate books/manuscripts within the same world. Co-authors see the shared knowledge graph and can draft simultaneously without stepping on each other's work."
  },
  {
    question: "Is there a word limit?",
    answer: "No. NovelWorld handles manuscripts from short stories to 500K+ word epics. The knowledge graph scales. The AI context window adapts based on your plan."
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map((item, index) => ({
    "@type": "Question",
    "@id": `https://novelworld.ai/#faq-${index + 1}`,
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">NovelWorld</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h1 className="font-serif text-5xl font-normal leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                  Build Fictional Worlds with Intelligence
                </h1>
                <p className="mt-8 max-w-xl text-xl leading-relaxed text-muted-foreground">
                  NovelWorld&apos;s AI-powered knowledge graph helps you organize characters,
                  plot dependencies, and story structure in one intelligent workspace.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Used by 2,500+ emerging fiction writers worldwide
                  </span>
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    4.8/5 from 300+ reviews
                  </span>
                </div>
                <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="h-14 px-8 text-base shadow-lg hover:shadow-xl transition-shadow">
                      Start Free Trial
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                      Watch Demo (2 min)
                    </Button>
                  </Link>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  No credit card required
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-lg">
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <Network className="h-24 w-24 text-muted-foreground/30" />
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  NovelWorld knowledge graph showing character relationships and plot connections
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="border-y bg-card py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                Why Most Fiction Writers Struggle
              </h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
              <div className="rounded-xl border bg-background p-6">
                <h3 className="text-lg font-semibold">Scattered Story Information</h3>
                <p className="mt-3 text-muted-foreground">
                  Characters scattered across Google Docs. Plot notes in random notebooks.
                  Relationship details you can&apos;t find when you need them. Your story world
                  lives in fragments.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <h3 className="text-lg font-semibold">Inconsistent Details Break Immersion</h3>
                <p className="mt-3 text-muted-foreground">
                  A character&apos;s age changes in Chapter 15. Locations shift. Timeline
                  inconsistencies readers catch that you missed. These breaks destroy
                  reader trust and your credibility.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <h3 className="text-lg font-semibold">Plotting Without Context</h3>
                <p className="mt-3 text-muted-foreground">
                  How does this plot point affect that character&apos;s goal? Where&apos;s the
                  connection between events? Without seeing your story as a web of
                  relationships, you miss opportunities for deeper stories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="features" className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                The NovelWorld Difference
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                Knowledge Graph Architecture
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Instead of treating your story as a collection of loose documents,
                NovelWorld models your fictional world as an intelligent network where
                characters, locations, events, and ideas connect with meaning.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Intelligent World Building</h3>
                <p className="mt-3 text-muted-foreground">
                  Create characters, locations, events, and concepts. NovelWorld learns
                  the connections between them. When you edit a character&apos;s motivation,
                  AI suggests related plot opportunities automatically.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Consistency Engine</h3>
                <p className="mt-3 text-muted-foreground">
                  AI monitors your manuscript for inconsistencies in real-time. Character
                  details, timeline conflicts, location descriptions—NovelWorld catches
                  what your eyes miss and suggests fixes.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Plot Intelligence</h3>
                <p className="mt-3 text-muted-foreground">
                  See how plot points impact character arcs. Identify missing connections
                  that create richer stories. AI suggests plot deepening based on your
                  world structure.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <PenLine className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Intelligent Drafting</h3>
                <p className="mt-3 text-muted-foreground">
                  When you write a scene, NovelWorld feeds your story context to the AI.
                  Get scene suggestions that respect your world&apos;s rules, character
                  personalities, and plot trajectory.
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mx-auto mt-16 max-w-4xl overflow-x-auto">
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
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-y bg-card py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                How It Works
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                How NovelWorld Works
              </h2>
            </div>

            <div className="mx-auto mt-16 max-w-4xl space-y-16">
              {/* Step 1 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-4 text-6xl font-bold text-primary/20">1</div>
                  <h3 className="text-2xl font-semibold">Build Your World</h3>
                  <p className="mt-4 text-muted-foreground">
                    Create characters with details that matter. Map locations. Plot events.
                    Define factions and concepts. NovelWorld organizes everything into a
                    living knowledge graph.
                  </p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <Network className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div className="order-2 md:order-1 rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="mb-4 text-6xl font-bold text-primary/20">2</div>
                  <h3 className="text-2xl font-semibold">Connect the Dots</h3>
                  <p className="mt-4 text-muted-foreground">
                    Relationships form automatically. Show how characters meet. Define plot
                    dependencies. See timeline conflicts resolved. Your world becomes a
                    coherent web.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-4 text-6xl font-bold text-primary/20">3</div>
                  <h3 className="text-2xl font-semibold">Write with Intelligence</h3>
                  <p className="mt-4 text-muted-foreground">
                    When you draft scenes, NovelWorld feeds your world context to the AI.
                    Get scene suggestions that respect your characters, locations, and plot.
                    Write faster with consistency.
                  </p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <PenLine className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div className="order-2 md:order-1 rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <Zap className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <div className="mb-4 text-6xl font-bold text-primary/20">4</div>
                  <h3 className="text-2xl font-semibold">Refine & Polish</h3>
                  <p className="mt-4 text-muted-foreground">
                    AI flags inconsistencies. Suggest pacing improvements. Identify plot
                    holes. Revise with your world&apos;s rules in mind. Your first draft gets
                    stronger, not generic.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  Watch 2-Minute Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                Testimonials
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                Writers Love NovelWorld
              </h2>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6">
                <Quote className="h-8 w-8 text-primary/30" />
                <blockquote className="mt-4 text-muted-foreground">
                  &quot;I finally have a place to keep all my story ideas organized.
                  The knowledge graph shows me connections I never would have seen.
                  It&apos;s like having a creative partner.&quot;
                </blockquote>
                <div className="mt-6">
                  <p className="font-semibold">Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">Fiction Writer, 50K+ Discord community</p>
                  <p className="mt-2 text-xs text-muted-foreground">Completed 2 novels with NovelWorld</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <Quote className="h-8 w-8 text-primary/30" />
                <blockquote className="mt-4 text-muted-foreground">
                  &quot;Before NovelWorld, I kept track of character details in my head.
                  That doesn&apos;t scale. Now I can write longer, more complex stories
                  without losing threads. Game changer.&quot;
                </blockquote>
                <div className="mt-6">
                  <p className="font-semibold">Marcus Johnson</p>
                  <p className="text-sm text-muted-foreground">Indie Author, 3-book fantasy series</p>
                  <p className="mt-2 text-xs text-muted-foreground">Self-published on Amazon, 5-star reviews</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <Quote className="h-8 w-8 text-primary/30" />
                <blockquote className="mt-4 text-muted-foreground">
                  &quot;The consistency checking saved me from a massive timeline error
                  in my manuscript. Readers would have caught it. NovelWorld caught it first.&quot;
                </blockquote>
                <div className="mt-6">
                  <p className="font-semibold">Dr. Emma Roberts</p>
                  <p className="text-sm text-muted-foreground">Academic + Fiction Writer</p>
                  <p className="mt-2 text-xs text-muted-foreground">Published traditionally + indie hybrid model</p>
                </div>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                4.8/5 stars from 300+ user reviews
              </span>
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Used by 2,500+ writers in 45 countries
              </span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="border-y bg-card py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                FAQ
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
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
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <PricingSection />

        {/* Final CTA */}
        <section className="border-t bg-card py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              Start Building Your Story World
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              No credit card required. Free forever plan included.
              Cancel anytime (though we hope you won&apos;t!).
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-base shadow-lg">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                Takes 2 minutes to sign up
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Secure
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Encrypted
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Privacy-first
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                GDPR compliant
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
