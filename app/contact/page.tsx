import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { BookOpen, Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact - NovelWorld AI",
  description: "Get in touch with the NovelWorld AI team",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">NovelWorld AI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions about NovelWorld AI? We&apos;d love to hear from you.
            </p>

            <div className="mt-12 space-y-8">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Email Support</h2>
                  <p className="mt-1 text-muted-foreground">
                    For general inquiries and support requests
                  </p>
                  <a
                    href="mailto:support@novelworld.ai"
                    className="mt-2 inline-block text-primary hover:underline"
                  >
                    support@novelworld.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Feedback</h2>
                  <p className="mt-1 text-muted-foreground">
                    We&apos;re always looking to improve. Share your ideas and suggestions.
                  </p>
                  <a
                    href="mailto:feedback@novelworld.ai"
                    className="mt-2 inline-block text-primary hover:underline"
                  >
                    feedback@novelworld.ai
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-16 rounded-lg border bg-muted/50 p-6">
              <h2 className="text-lg font-semibold">Response Times</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We typically respond to all inquiries within 24-48 business hours.
                Pro subscribers receive priority support with faster response times.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
