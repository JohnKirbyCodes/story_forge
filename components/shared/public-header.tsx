"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface PublicHeaderProps {
  activeLink?: string;
}

export function PublicHeader({ activeLink }: PublicHeaderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isActive = (path: string) => {
    if (activeLink) return activeLink === path;
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold font-serif">NovelWorld</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className={`text-sm transition-colors ${
              isActive("/#features")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className={`text-sm transition-colors ${
              isActive("/#how-it-works")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`text-sm transition-colors ${
              isActive("/pricing")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className={`text-sm transition-colors ${
              isActive("/#faq")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Start Free</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
