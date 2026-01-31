import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      `Missing Supabase admin credentials: ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim()
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
