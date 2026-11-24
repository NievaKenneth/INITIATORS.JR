export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    const missingVariables = [];
    if (!url) missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) missingVariables.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    throw new Error(
      `Missing required Supabase environment variable(s): ${missingVariables.join(", ")}. Copy .env.example to .env.local and configure the HOPE Inc. project values.`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL using http or https.",
    );
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL using http or https.",
    );
  }

  return { url, anonKey };
}
