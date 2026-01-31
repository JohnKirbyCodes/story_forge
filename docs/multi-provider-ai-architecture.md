# Multi-Provider AI Architecture

StoryForge supports multiple AI providers (Anthropic, OpenAI, Google) simultaneously. Users can configure API keys for any combination of providers and select models from any configured provider for different tasks.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────────┤
│  AI Settings Page              │  Scene/Book Editors                    │
│  ┌─────────────────────┐       │  ┌───────────────────────────────────┐ │
│  │ Anthropic: [key]    │       │  │ Model: [GPT-4o ▼]                 │ │
│  │ OpenAI:   [key]     │       │  │        ├─ Anthropic              │ │
│  │ Google:   [key]     │       │  │        │  ├─ Claude Opus 4       │ │
│  └─────────────────────┘       │  │        │  ├─ Claude Sonnet 4     │ │
│                                │  │        │  └─ Claude 3.5 Haiku    │ │
│                                │  │        ├─ OpenAI                 │ │
│                                │  │        │  ├─ GPT-4o ✓            │ │
│                                │  │        │  └─ GPT-4o Mini         │ │
│                                │  │        └─ Google                 │ │
│                                │  │           └─ Gemini 2.5 Pro      │ │
│                                │  └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  POST /api/ai/generate-scene                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. Extract requestedModel from request body                      │   │
│  │ 2. Call getUserProvider(supabase, userId, requestedModel)        │   │
│  │ 3. Use provider instance with Vercel AI SDK                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      getUserProvider()                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Input: userId, requestedModel (e.g., "gpt-4o")                        │
│                                                                         │
│  1. Fetch profile with all per-provider key columns                    │
│  2. Determine provider from model: getProviderForModel("gpt-4o")       │
│     → Returns "openai"                                                  │
│  3. Look up key: profile.ai_key_openai                                 │
│  4. Check validity: profile.ai_key_valid_openai                        │
│  5. Decrypt key: decryptApiKeyEmbedded(encryptedKey)                   │
│  6. Create SDK instance: createProviderInstance("openai", apiKey)      │
│                                                                         │
│  Output: { instance, provider: "openai", defaultModelId: "gpt-4o" }    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Vercel AI SDK                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  @ai-sdk/anthropic  │  @ai-sdk/openai  │  @ai-sdk/google               │
│  createAnthropic()  │  createOpenAI()  │  createGoogleGenerativeAI()   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. API Key Storage Flow

```
User enters API key in Settings
         │
         ▼
┌────────────────────────────────────┐
│  POST /api/settings/ai-key         │
│  { provider: "openai",             │
│    apiKey: "sk-proj-..." }         │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Validation                        │
│  1. validateApiKeyFormat()         │
│  2. Test API call to provider      │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Encryption                        │
│  encryptApiKeyEmbedded(apiKey)     │
│  → IV + ciphertext + authTag       │
│  → base64 encoded                  │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Database: profiles table          │
│  ai_key_openai = "base64..."       │
│  ai_key_valid_openai = true        │
└────────────────────────────────────┘
```

### 2. AI Generation Flow

```
User selects GPT-4o and clicks Generate
         │
         ▼
┌────────────────────────────────────┐
│  Client: useCompletion()           │
│  body: { model: "gpt-4o", ... }    │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Server: /api/ai/generate-scene    │
│  const { model } = await req.json()│
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  getUserProvider(supabase, userId, │
│                  "gpt-4o")         │
│                                    │
│  1. getProviderForModel("gpt-4o")  │
│     → "openai"                     │
│  2. Fetch ai_key_openai from DB    │
│  3. decryptApiKeyEmbedded()        │
│  4. createOpenAI({ apiKey })       │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  streamText({                      │
│    model: instance.getModel(       │
│      "gpt-4o"                      │
│    ),                              │
│    prompt: "..."                   │
│  })                                │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  OpenAI API                        │
│  POST /v1/chat/completions         │
└────────────────────────────────────┘
```

## Database Schema

### profiles table (multi-provider columns)

| Column | Type | Description |
|--------|------|-------------|
| `ai_key_anthropic` | text | Encrypted Anthropic API key (embedded IV format) |
| `ai_key_openai` | text | Encrypted OpenAI API key (embedded IV format) |
| `ai_key_google` | text | Encrypted Google API key (embedded IV format) |
| `ai_key_valid_anthropic` | boolean | Whether Anthropic key is validated |
| `ai_key_valid_openai` | boolean | Whether OpenAI key is validated |
| `ai_key_valid_google` | boolean | Whether Google key is validated |

### Legacy columns (backward compatible)

| Column | Type | Description |
|--------|------|-------------|
| `ai_provider` | text | Single provider name ("anthropic", "openai", "google") |
| `ai_api_key_encrypted` | text | Encrypted API key (separate IV format) |
| `ai_api_key_iv` | text | IV for legacy encryption |
| `ai_api_key_valid` | boolean | Whether legacy key is validated |

## Encryption Formats

### Embedded IV Format (new per-provider keys)

```
base64(IV[16 bytes] + ciphertext + authTag[16 bytes])
```

**Functions:**
- `encryptApiKeyEmbedded(apiKey: string): string`
- `decryptApiKeyEmbedded(encryptedValue: string): string`

**Advantages:**
- Single column storage
- Self-contained (no separate IV column needed)
- Simpler database schema

### Legacy Format (backward compatible)

```
Column 1: base64(ciphertext + authTag[16 bytes])
Column 2: base64(IV[16 bytes])
```

**Functions:**
- `encryptApiKey(apiKey: string): { encrypted: string, iv: string }`
- `decryptApiKey({ encrypted, iv }): string`

## Key Files

### Configuration

| File | Purpose |
|------|---------|
| [lib/ai/providers/config.ts](../lib/ai/providers/config.ts) | Provider configs, model definitions, helper functions |
| [lib/ai/providers/factory.ts](../lib/ai/providers/factory.ts) | Creates SDK instances for each provider |
| [lib/ai/providers/user-provider.ts](../lib/ai/providers/user-provider.ts) | Fetches and decrypts user's API keys |
| [lib/crypto/api-key-encryption.ts](../lib/crypto/api-key-encryption.ts) | AES-256-GCM encryption/decryption |

### API Routes

| Route | Purpose |
|-------|---------|
| [app/api/settings/ai-key/route.ts](../app/api/settings/ai-key/route.ts) | Save/delete API keys |
| [app/api/settings/ai-provider/route.ts](../app/api/settings/ai-provider/route.ts) | Update model preferences |
| [app/api/ai/generate-scene/route.ts](../app/api/ai/generate-scene/route.ts) | Generate scene prose |
| [app/api/ai/edit-prose/route.ts](../app/api/ai/edit-prose/route.ts) | Edit selected text |
| [app/api/ai/generate-outline/route.ts](../app/api/ai/generate-outline/route.ts) | Generate book outline |
| [app/api/ai/generate-synopsis/route.ts](../app/api/ai/generate-synopsis/route.ts) | Generate book synopsis |

### UI Components

| Component | Purpose |
|-----------|---------|
| [components/dashboard/ai-settings.tsx](../components/dashboard/ai-settings.tsx) | Multi-provider API key management |
| [components/shared/model-selector.tsx](../components/shared/model-selector.tsx) | Model dropdown with provider grouping |
| [components/editor/scene-editor.tsx](../components/editor/scene-editor.tsx) | Scene editor with model selection |

## Supported Providers & Models

### Anthropic (Claude)

| Model ID | Display Name | Tier |
|----------|--------------|------|
| `claude-opus-4-20250514` | Claude Opus 4 | Premium |
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | Standard |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku | Fast |

### OpenAI (GPT)

| Model ID | Display Name | Tier |
|----------|--------------|------|
| `gpt-4o` | GPT-4o | Premium |
| `gpt-4-turbo` | GPT-4 Turbo | Standard |
| `gpt-4o-mini` | GPT-4o Mini | Fast |

### Google (Gemini)

| Model ID | Display Name | Tier |
|----------|--------------|------|
| `gemini-2.5-pro-preview-06-05` | Gemini 2.5 Pro | Premium |
| `gemini-2.0-flash` | Gemini 2.0 Flash | Standard |
| `gemini-2.0-flash-lite` | Gemini 2.0 Flash Lite | Fast |

## Helper Functions

### Provider Detection

```typescript
// Get provider from model ID
getProviderForModel("gpt-4o")  // Returns "openai"
getProviderForModel("claude-sonnet-4-20250514")  // Returns "anthropic"

// Check if model is valid for provider
isValidModel("openai", "gpt-4o")  // Returns true
isValidModel("anthropic", "gpt-4o")  // Returns false

// Check if model is valid for any of the providers
isValidModelForProviders("gpt-4o", ["anthropic", "openai"])  // Returns true
```

### Model Lists

```typescript
// Get all models from specified providers
getAllModels(["anthropic", "openai"])
// Returns: ModelWithProvider[] with provider info attached

// Get models grouped by provider
getModelsGroupedByProvider(["anthropic", "openai"])
// Returns: { anthropic: ModelConfig[], openai: ModelConfig[] }

// Get default model from first available provider
getDefaultModelFromProviders(["openai", "anthropic"])
// Returns: "gpt-4o" (OpenAI's default)
```

## Error Handling

### ProviderError Class

```typescript
class ProviderError extends Error {
  code: "NO_KEY" | "INVALID_KEY" | "DECRYPTION_ERROR" | "PROVIDER_ERROR";
  provider: AIProvider;
}
```

### Error Scenarios

| Code | Scenario | User Message |
|------|----------|--------------|
| `NO_KEY` | No API key configured for provider | "No API key configured for OpenAI. Please add your API key in Settings." |
| `DECRYPTION_ERROR` | Failed to decrypt stored key | "Failed to decrypt OpenAI API key. Please re-enter your key in Settings." |
| `PROVIDER_ERROR` | Failed to initialize SDK | "Failed to initialize OpenAI provider" |

## Backward Compatibility

The system maintains backward compatibility with the legacy single-provider setup:

1. **Legacy Key Fallback**: If no per-provider key exists, `getUserProvider` falls back to legacy columns when the provider matches
2. **Legacy Column Preservation**: Old columns remain in database during transition
3. **UI Compatibility**: Settings page shows "Active" badge for legacy keys too

### Migration Path

1. Run migration to add new columns (does NOT copy encrypted keys due to format incompatibility)
2. Existing users continue using legacy keys via fallback code
3. When users save new keys through UI, they're stored in per-provider columns with embedded format
4. Legacy columns can be removed in a future migration after full adoption

## Security Considerations

1. **Encryption**: All API keys encrypted with AES-256-GCM before database storage
2. **Key Management**: Encryption key stored in `API_KEY_ENCRYPTION_SECRET` environment variable
3. **Admin Client**: API routes use admin Supabase client to bypass RLS for key access
4. **Validation**: Keys validated against provider APIs before storage
5. **No Client Exposure**: Keys never sent to browser; only encrypted values and validity flags

## Testing Checklist

### Single Provider Setup
- [ ] Configure Anthropic key only
- [ ] Verify models show only Anthropic options
- [ ] Generate scene with Claude model
- [ ] Remove key and verify UI updates

### Multi-Provider Setup
- [ ] Configure both Anthropic and OpenAI keys
- [ ] Verify model dropdown shows both providers grouped
- [ ] Select Anthropic model, generate scene
- [ ] Select OpenAI model, generate scene (uses different key)
- [ ] Remove OpenAI key, verify OpenAI models disappear from dropdown

### Legacy Compatibility
- [ ] Existing user with legacy key can still generate
- [ ] After saving new key, per-provider column used
- [ ] Legacy fallback works when per-provider key missing

### Error Handling
- [ ] Request model from unconfigured provider shows proper error
- [ ] Invalid model ID falls back to default
- [ ] Decryption failure shows re-enter key message
