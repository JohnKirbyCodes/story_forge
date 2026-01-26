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
import { Progress } from "@/components/ui/progress";
import { LogOut, Settings, Sparkles } from "lucide-react";

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

  // Calculate word quota usage
  const wordsUsed = profile?.words_used_this_month || 0;
  const wordsQuota = profile?.words_quota || 10000;
  const isPro = profile?.subscription_tier === "pro";
  const usagePercent = wordsQuota ? Math.min((wordsUsed / wordsQuota) * 100, 100) : 0;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  return (
    <header className="flex h-16 items-center justify-end border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Word Quota Tracker */}
        <Link href="/dashboard/settings/billing" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-muted-foreground"}`} />
            <div className="flex flex-col items-end">
              <span className={`text-sm font-medium ${isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-600" : ""}`}>
                {wordsUsed.toLocaleString()} / {wordsQuota.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">AI words this month</span>
            </div>
          </div>
          <div className="w-24">
            <Progress
              value={usagePercent}
              className={`h-2 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-500" : ""}`}
            />
          </div>
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
              onClick={() => router.push("/dashboard/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
