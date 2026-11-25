import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import SetPasswordForm from "./SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
          <section className="mx-auto w-full max-w-[480px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Loading password setup...</p>
          </section>
        </main>
      }
    >
      <SetPasswordPageContent />
    </Suspense>
  );
}

async function SetPasswordPageContent() {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }

  if (!isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (!mustChangePassword) {
    if (appUser.role_code === "admin" || appUser.role_code === "superadmin") {
      redirect("/dashboard");
    }
    if (appUser.role_code === "user") {
      redirect("/user-dashboard");
    }
    redirect("/login");
  }

  return <SetPasswordForm />;
}
