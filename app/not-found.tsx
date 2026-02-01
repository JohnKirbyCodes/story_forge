import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>

            <h1 className="font-serif text-4xl font-bold">Page Not Found</h1>

            <p className="mt-4 text-lg text-muted-foreground">
              Sorry, we couldn&apos;t find the page you&apos;re looking for.
              It might have been moved or doesn&apos;t exist.
            </p>

            <div className="mt-8 flex justify-center">
              <Link href="/">
                <Button size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
