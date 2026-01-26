import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import {
  BookOpen,
  Network,
  Sparkles,
  Zap,
  PenLine,
  Users,
  Globe,
  Lightbulb,
  ChevronRight,
  Check,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StoryForge AI</span>
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
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                For Novelists & Worldbuilders
              </p>
              <h1 className="font-serif text-5xl font-normal leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                Finally, an AI That Knows Your Characters as Well as You Do
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground">
                Build a living Story Universe. Write scene beats. Let AI generate prose that remembers every character, relationship, and plot thread.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-base shadow-lg hover:shadow-xl transition-shadow">
                    Start Writing Free
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                    See How It Works
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                No credit card required • Free tier available
              </p>
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="border-y bg-card py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
                Other AI tools forget your characters by chapter three.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Generic AI assistants lose context. They don&apos;t know your protagonist&apos;s backstory, your villain&apos;s motivation, or that your hero has a scar from chapter one. You spend more time re-explaining than writing.
              </p>
              <p className="mt-4 text-lg font-medium text-foreground">
                StoryForge is different. It builds a persistent knowledge graph of your entire story universe—and uses it for every generation.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                Features
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                Everything You Need to Write Your Next Masterpiece
              </h2>
            </div>

            <div className="mt-20 space-y-24">
              {/* Feature 1 */}
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Network className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-3xl">Story Universe</h3>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Model your entire story as a knowledge graph. Characters, locations, factions, items, and events—all connected with rich relationships that evolve as your story progresses.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Visual node graph editor", "Automatic relationship tracking", "Timeline-aware connections"].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                  <div className="aspect-video rounded-lg bg-muted" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className="order-2 lg:order-1 rounded-2xl border bg-card p-8 shadow-sm">
                  <div className="aspect-video rounded-lg bg-muted" />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-3xl">Series Architecture</h3>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Create a World Bible that spans your entire series. Characters, lore, and history persist across multiple books, ensuring consistency in your epic saga.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Multi-book projects", "Shared character arcs", "Persistent world history"].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-3xl">Beats → Prose</h3>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Write quick scene beats describing what happens. AI transforms them into polished prose, using your style guide and full story context. Keep creative control while accelerating your writing.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Customizable writing style", "Tone and pacing controls", "One-click regeneration"].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                  <div className="aspect-video rounded-lg bg-muted" />
                </div>
              </div>

              {/* Feature 4 */}
              <div className="grid items-center gap-12 lg:grid-cols-2">
                <div className="order-2 lg:order-1 rounded-2xl border bg-card p-8 shadow-sm">
                  <div className="aspect-video rounded-lg bg-muted" />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-3xl">Context-Aware AI</h3>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Every generation pulls relevant context from your Story Universe automatically. No more copy-pasting character descriptions or re-explaining plot points.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {["Automatic context selection", "Character voice consistency", "Plot continuity checks"].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
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
                From Idea to Manuscript in Four Steps
              </h2>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "01", title: "Build Your Universe", description: "Create characters, locations, and define relationships in your Story Universe.", icon: Network },
                { step: "02", title: "Outline Your Book", description: "Structure chapters and scenes. Let AI suggest plot points based on your world.", icon: PenLine },
                { step: "03", title: "Write Scene Beats", description: "Describe what happens in each scene with quick, informal beats.", icon: Lightbulb },
                { step: "04", title: "Generate & Refine", description: "AI transforms beats into prose. Edit, regenerate, and polish until perfect.", icon: Sparkles },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="mb-4 text-5xl font-bold text-primary/20">{item.step}</div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary">
                Who It&apos;s For
              </p>
              <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
                Built for Serious Storytellers
              </h2>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
              {[
                { title: "Series Writers", description: "Managing multiple books with recurring characters? Keep everything consistent across your saga.", icon: BookOpen },
                { title: "Worldbuilders", description: "Creating complex fantasy or sci-fi worlds? Map every faction, magic system, and culture.", icon: Globe },
                { title: "Planners & Plotters", description: "Love outlining before writing? Structure your entire story before generating a single word of prose.", icon: PenLine },
                { title: "Discovery Writers", description: "Prefer to write into the dark? The Story Universe grows with you, capturing details as you create.", icon: Users },
              ].map((item) => (
                <div key={item.title} className="flex gap-5 rounded-xl border bg-card p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Pricing Preview */}
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

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border bg-card p-8">
                <h3 className="text-lg font-semibold">Free</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Perfect for getting started</p>
                <ul className="mt-8 space-y-4">
                  {["1 project", "1 book", "15 story elements", "10,000 AI words/month", "TXT export"].map((item) => (
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
                  <span className="text-4xl font-bold">$15</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">For serious writers</p>
                <ul className="mt-8 space-y-4">
                  {["Unlimited projects", "Unlimited books", "Unlimited story elements", "150,000 AI words/month", "TXT export", "Priority support"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-8 block">
                  <Button className="w-full">Go Pro</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t bg-card py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              Your Story Universe Awaits
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Stop fighting with generic AI tools. Start building your story universe today.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-base shadow-lg">
                  Create Your Free Account
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Free tier available forever
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
