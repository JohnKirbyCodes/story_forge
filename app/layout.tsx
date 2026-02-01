import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NovelWorld - Knowledge Graph Writing Platform for Fiction",
  description: "Organize your novel's world with NovelWorld's AI-powered knowledge graph. Build character relationships, plot dependencies, and story structure effortlessly. Join fiction writers building better stories. Start free today—no credit card needed.",
  keywords: ["AI writing tool for fiction", "novel writing software AI", "knowledge graph writing platform", "AI novel outline generator", "fiction writing AI tools"],
  authors: [{ name: "NovelWorld" }],
  creator: "NovelWorld",
  metadataBase: new URL("https://novelworld.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Build Fictional Worlds Faster with NovelWorld",
    description: "Organize your novel's world with an AI knowledge graph. Create better stories with intelligent character and plot mapping. Free to try.",
    url: "https://novelworld.ai/",
    siteName: "NovelWorld",
    images: [
      {
        url: "/images/og-hero-1200x630.png",
        width: 1200,
        height: 630,
        alt: "NovelWorld knowledge graph interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NovelWorld: Knowledge Graph Writing for Novelists",
    description: "Build fictional worlds with intelligence. Knowledge graph + AI = better stories, faster. Free to try.",
    images: ["/images/twitter-card-1200x675.png"],
    creator: "@novelworldai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NovelWorld",
    url: "https://novelworld.ai/",
    logo: "https://novelworld.ai/images/logo-256x256.png",
    description: "AI-powered knowledge graph platform for fiction writers",
    sameAs: [
      "https://twitter.com/novelworldai",
      "https://www.linkedin.com/company/novelworld"
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NovelWorld",
    description: "Knowledge graph writing platform for fiction novels",
    url: "https://novelworld.ai/",
    image: "https://novelworld.ai/images/og-hero-1200x630.png",
    author: {
      "@type": "Organization",
      name: "NovelWorld"
    },
    applicationCategory: ["ProductionSoftware", "WritingApplications"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
      availability: "https://schema.org/InStock"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: 300,
      reviewCount: 300
    },
    operatingSystem: ["Web", "Chrome", "Safari", "Firefox"]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareSchema),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
