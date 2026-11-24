import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase sign out failed.", { code: error.name });
    return NextResponse.json(
      { message: "Unable to sign out. Please try again." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      },
    );
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}
