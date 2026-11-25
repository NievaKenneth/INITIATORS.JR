import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    confirmed?: string;
    error?: string;
    passwordSet?: string;
    passwordUpdated?: string;
  }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
          <section className="mx-auto w-full max-w-[480px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Loading sign in...</p>
          </section>
        </main>
      }
    >
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  await connection();
  const { appUser, isApproved } = await getCurrentAppUser();

  if (appUser && isApproved && !appUser.is_blocked) {
    redirect(
      appUser.role_code === "admin" || appUser.role_code === "superadmin"
        ? "/dashboard"
        : "/user-dashboard",
    );
  }

  const params = await searchParams;
  return (
    <LoginForm
      emailWasConfirmed={params.confirmed === "1"}
      confirmationLinkIsInvalid={params.error === "invalid_link"}
      passwordWasSet={params.passwordSet === "1"}
      passwordWasUpdated={params.passwordUpdated === "1"}
    />
  );
}
