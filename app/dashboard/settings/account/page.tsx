import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/dashboard/account-settings";

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("onboarding_completed, onboarding_skipped_at")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings.
        </p>
      </div>

      <AccountSettings
        onboardingCompleted={profile?.onboarding_completed ?? false}
        onboardingSkipped={!!profile?.onboarding_skipped_at}
      />
    </div>
  );
}
