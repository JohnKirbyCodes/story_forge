import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { PricingSection } from "@/components/shared/pricing-section";
import { SectionTracker, TrackedCTA } from "@/components/shared/marketing-tracker";
import { TrackedFAQAccordion } from "@/components/shared/tracked-accordion";
import { ComparisonTable } from "@/components/shared/comparison-table";
import {
  Zap,
  PenLine,
  Brain,
  Target,
  ChevronRight,
  Check,
  Star,
  Globe,
  Quote,
} from "lucide-react";

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/NovelWorld_PublicAssets`;

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
    answer: "NovelWorld has a free tier limited to 1 book and 15 story elements. Pro tier ($15/month) includes unlimited books and story elements. You bring your own OpenAI API key and are responsible for your own token usage costs."
  },
  {
    question: "Is my story private?",
    answer: "Yes. Your manuscript is encrypted at rest and in transit. Only you can access your content. We never use your story for training data."
  },
  {
    question: "Can I import my existing manuscript?",
    answer: "Not currently. Manuscript import is on our roadmap. For now, you can copy and paste your text into scenes and manually create your story elements in the knowledge graph."
  },
  {
    question: "How does the AI avoid repetitive suggestions?",
    answer: "NovelWorld's AI learns from what you accept and reject. It remembers your style, preferences, and story rules. The more you use it, the more personalized it becomes. It's not one-size-fits-all."
  },
  {
    question: "Can I collaborate with other writers?",
    answer: "Not currently. NovelWorld is designed for individual writers. Multi-user collaboration is on our roadmap for a future release."
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

      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <SectionTracker sectionId="hero">
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
                  <TrackedCTA location="hero" variant="primary">
                    <Link href="/signup">
                      <Button size="lg" className="h-14 px-8 text-base shadow-lg hover:shadow-xl transition-shadow">
                        Start Free Trial
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </TrackedCTA>
                  <TrackedCTA location="hero" variant="secondary">
                    <Link href="#how-it-works">
                      <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                        Watch Demo (2 min)
                      </Button>
                    </Link>
                  </TrackedCTA>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  No credit card required
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-lg">
                <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
                  <Image
                    src={`${STORAGE_BASE}/NovelWorld-StoryUniverse.png`}
                    alt="NovelWorld knowledge graph showing character relationships and plot connections"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  NovelWorld knowledge graph showing character relationships and plot connections
                </p>
              </div>
            </div>
          </div>
        </section>
        </SectionTracker>

        {/* Pain Point Section */}
        <SectionTracker sectionId="pain-points">
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
        </SectionTracker>

        {/* Solution Section */}
        <SectionTracker sectionId="features">
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
            <ComparisonTable />
          </div>
        </section>
        </SectionTracker>

        {/* How It Works */}
        <SectionTracker sectionId="how-it-works">
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
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
                    <Image
                      src={`${STORAGE_BASE}/NovelWorld-NodeDetails.png`}
                      alt="Creating detailed character and story nodes"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div className="order-2 md:order-1 rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
                    <Image
                      src={`${STORAGE_BASE}/NovelWorld-StoryUniverse.png`}
                      alt="Story universe graph showing connected relationships"
                      fill
                      className="object-cover"
                    />
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
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
                    <Image
                      src={`${STORAGE_BASE}/NovelWorld-BookSceneWritingEditor.png`}
                      alt="Scene writing editor with AI assistance"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div className="order-2 md:order-1 rounded-xl border bg-background p-4">
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
                    <Image
                      src={`${STORAGE_BASE}/NovelWorld-AIProseEditor.png`}
                      alt="AI-powered prose editing and refinement"
                      fill
                      className="object-cover"
                    />
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
              <TrackedCTA location="how-it-works" variant="demo">
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline">
                    Watch 2-Minute Demo
                  </Button>
                </Link>
              </TrackedCTA>
            </div>
          </div>
        </section>
        </SectionTracker>

        {/* Testimonials Section */}
        <SectionTracker sectionId="testimonials">
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
        </SectionTracker>

        {/* FAQ Section */}
        <SectionTracker sectionId="faq">
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
              <TrackedFAQAccordion items={faqItems} />
            </div>
          </div>
        </section>
        </SectionTracker>

        {/* Pricing Preview */}
        <PricingSection />

        {/* Final CTA */}
        <SectionTracker sectionId="final-cta">
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
              <TrackedCTA location="final-cta" variant="primary">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-10 text-base shadow-lg">
                    Start Free Trial
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TrackedCTA>
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
        </SectionTracker>
      </main>

      <Footer />
    </div>
  );
}
