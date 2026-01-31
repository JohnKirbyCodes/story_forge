"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AccountSettingsProps {
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
}

export function AccountSettings({
  onboardingCompleted,
  onboardingSkipped,
}: AccountSettingsProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/onboarding/reset", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset onboarding");
      }

      toast.success("Onboarding reset! Refreshing page...");

      // Refresh the page to trigger onboarding
      setTimeout(() => {
        router.refresh();
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset onboarding"
      );
    } finally {
      setIsResetting(false);
    }
  };

  const hasCompletedOrSkipped = onboardingCompleted || onboardingSkipped;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding</CardTitle>
          <CardDescription>
            Manage your onboarding experience and tutorial settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Onboarding Status</p>
              <p className="text-sm text-muted-foreground">
                {onboardingCompleted
                  ? "You have completed the onboarding flow."
                  : onboardingSkipped
                  ? "You skipped the onboarding flow."
                  : "You have not completed onboarding yet."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  onboardingCompleted
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                    : onboardingSkipped
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                }`}
              >
                {onboardingCompleted
                  ? "Completed"
                  : onboardingSkipped
                  ? "Skipped"
                  : "In Progress"}
              </span>
            </div>
          </div>

          {hasCompletedOrSkipped && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Restart Onboarding</p>
                  <p className="text-sm text-muted-foreground">
                    Re-run the onboarding tutorial to learn about NovelWorld
                    features.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isResetting}>
                      {isResetting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Restart
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restart Onboarding?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset your onboarding progress and show the
                        welcome tutorial again. Your projects, books, and data
                        will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetOnboarding}>
                        Restart Onboarding
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
