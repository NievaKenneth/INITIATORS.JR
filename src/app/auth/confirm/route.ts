import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConfirmationType = "email" | "recovery" | "invite";
type ConfirmationPath = "/login" | "/reset-password" | "/set-password";

function redirectTo(requestUrl: URL, path: string) {
  const response = NextResponse.redirect(new URL(path, requestUrl));
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function failurePath(type: ConfirmationType) {
  return type === "recovery"
    ? "/reset-password?error=invalid"
    : "/login?error=invalid_link";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const requestedType = requestUrl.searchParams.get("type");
  const requestedNext = requestUrl.searchParams.get("next");
  const safeNext: ConfirmationPath | null =
    requestedNext === "/login" ||
    requestedNext === "/reset-password" ||
    requestedNext === "/set-password"
      ? requestedNext
      : null;

  if (
    requestedType !== "email" &&
    requestedType !== "recovery" &&
    requestedType !== "invite"
  ) {
    const invalidPath =
      safeNext === "/reset-password"
        ? "/reset-password?error=invalid"
        : "/login?error=invalid_link";
    return redirectTo(requestUrl, invalidPath);
  }

  const type: ConfirmationType = requestedType;
  if (!tokenHash) {
    return redirectTo(requestUrl, failurePath(type));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return redirectTo(requestUrl, failurePath(type));
  }

  if (type === "email") {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Unable to clear the confirmed signup session.", {
        code: signOutError.name,
      });
      return redirectTo(requestUrl, failurePath(type));
    }

    return redirectTo(requestUrl, "/login?confirmed=1");
  }

  return redirectTo(
    requestUrl,
    type === "recovery" ? "/reset-password" : "/set-password",
  );
}
