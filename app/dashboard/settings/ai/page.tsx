import { createClient } from "@/lib/supabase/server";
import { AISettings } from "@/components/dashboard/ai-settings";

export default async function AISettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SECURITY: Only fetch validity flags and preferences - NEVER send encrypted keys to client
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select(`
          ai_provider,
          ai_api_key_valid,
          ai_default_model,
          ai_model_outline,
          ai_model_synopsis,
          ai_model_scene,
          ai_model_edit,
          ai_model_universe,
          ai_key_valid_anthropic,
          ai_key_valid_openai,
          ai_key_valid_google
        `)
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI provider and API key for text generation.
        </p>
      </div>

      <AISettings profile={profile} />
    </div>
  );
}
