import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privilegierter Supabase-Client mit Service-Role-Key. Umgeht RLS.
 * NUR serverseitig verwenden (Server-Actions / Route-Handler) — niemals im Browser.
 */
export function createAdminClient(options?: { schema?: string }) {
  return createClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: options?.schema ?? "public" },
    },
  );
}
