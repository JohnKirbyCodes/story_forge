import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { encryptApiKey, encryptApiKeyEmbedded } from "@/lib/crypto/api-key-encryption";
import {
  AIProvider,
  validateApiKeyFormat,
  PROVIDER_CONFIGS,
  isValidProvider,
} from "@/lib/ai/providers/config";
import { saveAiKeySchema, validateRequest } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

async function validateApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<boolean> {
  try {
    switch (provider) {
      case "anthropic": {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "Hi" }],
          }),
        });
        // 401 = invalid key
        return response.status !== 401;
      }

      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return response.ok;
      }

      case "google": {
        // Use POST body instead of URL query param for API key
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1/models",
          {
            headers: { "x-goog-api-key": apiKey },
          }
        );
        return response.ok;
      }

      default:
        return false;
    }
  } catch {
    // Don't log the full error to avoid leaking key details
    return false;
  }
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

    const body = await request.json();
    const validation = validateRequest(saveAiKeySchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { provider, apiKey } = validation.data;

    // Validate key format
    if (!validateApiKeyFormat(provider, apiKey)) {
      return NextResponse.json(
        {
          error: `Invalid API key format for ${PROVIDER_CONFIGS[provider].displayName}`,
        },
        { status: 400 }
      );
    }

    // Validate key works with the provider
    logger.info("Validating API key with provider", { provider });
    const isValid = await validateApiKey(provider, apiKey);
    if (!isValid) {
      logger.warn("API key validation failed", { provider });
      return NextResponse.json(
        {
          error:
            "API key validation failed. Please check your key and try again.",
        },
        { status: 400 }
      );
    }

    // Encrypt the API key
    let embeddedEncrypted: string;
    let legacyEncrypted: string;
    let legacyIv: string;
    try {
      // Use embedded format for per-provider columns (IV included in the value)
      embeddedEncrypted = encryptApiKeyEmbedded(apiKey);
      // Use legacy format for backward compatibility columns
      const legacyResult = encryptApiKey(apiKey);
      legacyEncrypted = legacyResult.encrypted;
      legacyIv = legacyResult.iv;
    } catch (encryptError) {
      const err = encryptError as Error;
      logger.error("Encryption failed", {
        errorName: err.name,
        errorMessage: err.message,
      });
      throw encryptError;
    }

    // Build provider-specific update
    const providerKeyColumn = `ai_key_${provider}` as const;
    const providerValidColumn = `ai_key_valid_${provider}` as const;

    // Verify service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Save to database using admin client
    const adminSupabase = createAdminClient();
    logger.info("Saving API key to database", { provider, userId: user.id });

    const { error } = await adminSupabase
      .from("profiles")
      .update({
        // Provider-specific columns (new format with embedded IV)
        [providerKeyColumn]: embeddedEncrypted,
        [providerValidColumn]: true,
        // Legacy columns for backward compatibility (with separate IV)
        ai_provider: provider,
        ai_api_key_encrypted: legacyEncrypted,
        ai_api_key_iv: legacyIv,
        ai_api_key_valid: true,
      })
      .eq("id", user.id);

    if (error) {
      logger.error("Supabase error saving API key", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    return NextResponse.json({ success: true, provider });
  } catch (error) {
    const err = error as Error & { code?: string; details?: string; hint?: string };
    logger.error("Failed to save API key", {
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.code,
      errorDetails: err.details,
      errorHint: err.hint,
    });
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get provider from query params or body
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    const adminSupabase = createAdminClient();

    if (provider && isValidProvider(provider)) {
      // Delete specific provider's key
      const providerKeyColumn = `ai_key_${provider}` as const;
      const providerValidColumn = `ai_key_valid_${provider}` as const;

      const { error } = await adminSupabase
        .from("profiles")
        .update({
          [providerKeyColumn]: null,
          [providerValidColumn]: false,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, provider });
    } else {
      // Delete all keys (legacy behavior)
      const { error } = await adminSupabase
        .from("profiles")
        .update({
          ai_api_key_encrypted: null,
          ai_api_key_iv: null,
          ai_api_key_valid: false,
          ai_key_anthropic: null,
          ai_key_valid_anthropic: false,
          ai_key_openai: null,
          ai_key_valid_openai: false,
          ai_key_google: null,
          ai_key_valid_google: false,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    logger.error("Failed to remove API key", error);
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
}
