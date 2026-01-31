import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  isValidProvider,
  getDefaultModel,
  getProviderForModel,
  AIProvider,
} from "@/lib/ai/providers/config";

// Valid task types for task-specific model settings
const VALID_TASK_TYPES = ["outline", "synopsis", "scene", "edit", "universe"] as const;
type TaskType = (typeof VALID_TASK_TYPES)[number];

interface UpdateRequest {
  provider?: string;
  defaultModel?: string;
  taskModels?: Partial<Record<TaskType, string>>;
}

interface ValidProviders {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, defaultModel, taskModels }: UpdateRequest =
      await request.json();

    // Validate provider if provided
    if (provider && !isValidProvider(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Get user's valid providers (which providers have valid API keys)
    const validProviders = await getValidProviders(adminSupabase, user.id);

    // Build update object based on what's provided
    const updateData: Record<string, string | null> = {};

    if (provider) {
      updateData.ai_provider = provider;
      // If changing provider, reset default model to new provider's default
      // but keep task models since they might be from other valid providers
      if (!defaultModel) {
        const newDefault = getDefaultModel(provider as AIProvider);
        updateData.ai_default_model = newDefault;
      }
    }

    if (defaultModel) {
      // Validate model belongs to ANY valid provider
      const modelProvider = getProviderForModel(defaultModel);
      if (!modelProvider) {
        return NextResponse.json(
          { error: "Unknown model" },
          { status: 400 }
        );
      }
      if (!validProviders[modelProvider]) {
        return NextResponse.json(
          { error: `No valid API key for ${modelProvider}` },
          { status: 400 }
        );
      }
      updateData.ai_default_model = defaultModel;
    }

    // Handle task-specific model updates
    if (taskModels) {
      for (const [task, modelId] of Object.entries(taskModels)) {
        if (!VALID_TASK_TYPES.includes(task as TaskType)) {
          return NextResponse.json(
            { error: `Invalid task type: ${task}` },
            { status: 400 }
          );
        }

        if (modelId === null || modelId === "") {
          // Allow clearing task-specific model to use default
          updateData[`ai_model_${task}`] = null;
        } else {
          // Validate model belongs to ANY valid provider
          const modelProvider = getProviderForModel(modelId);
          if (!modelProvider) {
            return NextResponse.json(
              { error: `Unknown model for ${task}: ${modelId}` },
              { status: 400 }
            );
          }
          if (!validProviders[modelProvider]) {
            return NextResponse.json(
              { error: `No valid API key for ${modelProvider} (required for ${task})` },
              { status: 400 }
            );
          }
          updateData[`ai_model_${task}`] = modelId;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    console.log("Updating profile with:", updateData);

    const { error } = await adminSupabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update provider" },
      { status: 500 }
    );
  }
}

async function getValidProviders(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<ValidProviders> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "ai_key_valid_anthropic, ai_key_valid_openai, ai_key_valid_google, ai_api_key_valid, ai_provider"
    )
    .eq("id", userId)
    .single();

  // Include legacy single-provider setup for backward compatibility
  const legacyValid =
    data?.ai_api_key_valid && data?.ai_provider
      ? { [data.ai_provider]: true }
      : {};

  return {
    anthropic: data?.ai_key_valid_anthropic || legacyValid.anthropic || false,
    openai: data?.ai_key_valid_openai || legacyValid.openai || false,
    google: data?.ai_key_valid_google || legacyValid.google || false,
  };
}
