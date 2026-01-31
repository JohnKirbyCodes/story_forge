import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - NovelWorld AI",
  description: "Privacy Policy for NovelWorld AI",
};

export default function PrivacyPage() {
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
          <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="lead">
              Last updated: January 2026
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              When you use NovelWorld AI, we collect information you provide directly to us, including:
            </p>
            <ul>
              <li>Account information (name, email address)</li>
              <li>Content you create (projects, books, characters, scenes)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data and preferences</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new features and services</li>
            </ul>

            <h2>3. AI and Your Content</h2>
            <p>
              When you use our AI features, your content is processed to generate responses.
              We do not use your creative content to train AI models. Your stories, characters,
              and world-building remain yours.
            </p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information.
              Your data is encrypted in transit and at rest. We use industry-standard security
              practices to safeguard your content.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed
              to provide you services. You can request deletion of your account and associated
              data at any time.
            </p>

            <h2>6. Third-Party Services</h2>
            <p>
              We use trusted third-party services to help operate our platform:
            </p>
            <ul>
              <li>Stripe for payment processing</li>
              <li>Supabase for data storage and authentication</li>
              <li>Anthropic for AI capabilities</li>
              <li>Vercel for hosting and analytics</li>
            </ul>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your content</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2>8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@novelworld.ai">privacy@novelworld.ai</a>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
