import { createAnthropic } from "@ai-sdk/anthropic";

let _anthropic: ReturnType<typeof createAnthropic> | null = null;

export const getAnthropic = () => {
  if (!_anthropic) {
    _anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
};

// For backward compatibility - lazy getter
export const anthropic = new Proxy({} as ReturnType<typeof createAnthropic>, {
  get(_, prop) {
    return (getAnthropic() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
