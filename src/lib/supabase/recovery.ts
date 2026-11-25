import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getRecoverySessionStatus(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    return { isRecoverySession: false, error };
  }

  const amr = data?.claims?.amr;
  return {
    isRecoverySession:
      Array.isArray(amr) &&
      amr.some(
        (method) =>
          method === "recovery" ||
          (typeof method !== "string" && method.method === "recovery"),
      ),
    error: null,
  };
}
