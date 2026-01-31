import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit, createRateLimitResponse, RATE_LIMIT_IDS } from "@/lib/security/rate-limit";

/**
 * Validate that a redirect path is safe (relative path only, no protocol).
 * Prevents open redirect attacks.
 */
function getSafeRedirectPath(path: string | null): string {
  if (!path) return "/dashboard";

  // Must start with / and not contain protocol indicators
  if (!path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard"; // Protocol-relative URL
  if (path.includes("://")) return "/dashboard"; // Absolute URL with protocol
  if (path.includes("\\")) return "/dashboard"; // Backslash tricks

  // Decode and re-check to prevent encoded bypasses
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.startsWith("//") || decoded.includes("://") || decoded.includes("\\")) {
      return "/dashboard";
    }
  } catch {
    return "/dashboard"; // Invalid encoding
  }

  return path;
}

export async function GET(request: Request) {
  // Rate limit auth callbacks to prevent brute force
  const { rateLimited } = await checkApiRateLimit(RATE_LIMIT_IDS.AUTH_LOGIN, { request });
  if (rateLimited) {
    return createRateLimitResponse();
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safePath = getSafeRedirectPath(next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safePath, requestUrl.origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}
