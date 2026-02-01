"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, Key, CreditCard } from "lucide-react";

interface DashboardHeaderProps {
  user: User;
  profile: Profile | null;
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() || "U";

  const isPro = profile?.subscription_tier === "pro";
  const hasApiKey = profile?.ai_api_key_valid === true;

  return (
    <header className="flex h-16 items-center justify-end border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Subscription & API Key Status */}
        <Link href="/dashboard/settings/billing" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {!isPro && (
            <Badge variant="outline" className="text-xs">
              Free
            </Badge>
          )}
          {isPro && (
            <Badge className="text-xs bg-gradient-to-r from-violet-500 to-purple-500">
              Pro
            </Badge>
          )}
        </Link>

        {/* API Key indicator */}
        <Link
          href="/dashboard/settings/ai"
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          title={hasApiKey ? "API key configured" : "Configure your AI API key"}
        >
          <Key className={`h-4 w-4 ${hasApiKey ? "text-green-500" : "text-muted-foreground"}`} />
          {!hasApiKey && (
            <span className="text-xs text-muted-foreground">Setup AI</span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={profile?.avatar_url || undefined}
                  alt={profile?.full_name || "User"}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings/account")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings/ai")}
            >
              <Key className="mr-2 h-4 w-4" />
              AI Keys
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings/billing")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
