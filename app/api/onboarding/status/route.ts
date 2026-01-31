import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface OnboardingStatus {
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  onboarding_current_step: string | null;
  onboarding_skipped_at: string | null;
  onboarding_banner_dismissed: boolean;
  tooltips_dismissed: string[];
  // Include AI setup status for onboarding flow
  has_valid_ai_key: boolean;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        `onboarding_completed,
         onboarding_completed_at,
         onboarding_current_step,
         onboarding_skipped_at,
         onboarding_banner_dismissed,
         tooltips_dismissed,
         ai_key_valid_anthropic,
         ai_key_valid_openai,
         ai_key_valid_google,
         ai_api_key_valid`
      )
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching onboarding status:", error);
      return NextResponse.json(
        { error: "Failed to fetch onboarding status" },
        { status: 500 }
      );
    }

    // Determine if user has any valid AI key
    const hasValidAiKey =
      profile?.ai_key_valid_anthropic ||
      profile?.ai_key_valid_openai ||
      profile?.ai_key_valid_google ||
      profile?.ai_api_key_valid ||
      false;

    const status: OnboardingStatus = {
      onboarding_completed: profile?.onboarding_completed ?? false,
      onboarding_completed_at: profile?.onboarding_completed_at ?? null,
      onboarding_current_step: profile?.onboarding_current_step ?? "welcome",
      onboarding_skipped_at: profile?.onboarding_skipped_at ?? null,
      onboarding_banner_dismissed: profile?.onboarding_banner_dismissed ?? false,
      tooltips_dismissed: profile?.tooltips_dismissed ?? [],
      has_valid_ai_key: hasValidAiKey,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error in onboarding status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
