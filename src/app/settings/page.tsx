import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AppShell from "@/features/app-shell/AppShell";
import { getCurrentAppUser } from "@/lib/supabase/profile";

async function SettingsContent() {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (appUser.role_code !== "superadmin") {
    redirect(
      appUser.role_code === "admin" ? "/dashboard" : "/user-dashboard",
    );
  }

  return (
    <AppShell
      appUser={appUser}
      activePage="settings"
      pageTitle="System Settings"
    >
      <section aria-labelledby="settings-title">
        <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
          Administration
        </p>
        <h1
          className="text-[26px] leading-tight font-semibold text-hope-forest"
          id="settings-title"
        >
          System Settings
        </h1>
      </section>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory p-8 text-sm text-hope-ink">
          Loading settings...
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
