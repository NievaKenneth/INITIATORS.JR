import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecoverySessionStatus } from "@/lib/supabase/recovery";
import ResetPasswordForm from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
          <section className="mx-auto w-full max-w-[480px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Checking reset link...</p>
          </section>
        </main>
      }
    >
      <ResetPasswordPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordPageContent({
  searchParams,
}: ResetPasswordPageProps) {
  await connection();
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const { isRecoverySession, error: claimsError } = user
    ? await getRecoverySessionStatus(supabase)
    : { isRecoverySession: false, error: null };

  if (
    params.error === "invalid" ||
    userError ||
    !user ||
    claimsError ||
    !isRecoverySession
  ) {
    return (
      <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
        <section className="mx-auto w-full max-w-[480px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
          <h1 className="text-2xl font-semibold text-hope-forest">
            Choose a new password
          </h1>
          <p
            className="mt-4 rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-sm text-hope-ink"
            id="reset-link-error"
            role="alert"
          >
            This reset link is invalid or has expired. Request a new link.
          </p>
          <p className="mt-4 text-sm">
            <Link
              className="font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              href="/forgot-password"
            >
              Request a new link
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return <ResetPasswordForm />;
}
