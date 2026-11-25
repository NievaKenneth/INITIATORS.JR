import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "@/features/app-shell/AppShell";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import { getWorkspaceModuleAccess } from "@/lib/workspace";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 text-hope-ink sm:px-6">
          <section className="mx-auto w-full max-w-3xl rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Loading settings...</p>
          </section>
        </main>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

async function SettingsPageContent() {
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
      appUser.role_code === "user" ? "/user-dashboard" : "/dashboard",
    );
  }

  const moduleAccess = await getWorkspaceModuleAccess(appUser);

  return (
    <AppShell appUser={appUser} moduleAccess={moduleAccess} currentPath="/settings">
      <main className="min-h-[calc(100vh-72px)] px-4 py-8 text-hope-ink sm:px-6 sm:py-10 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Administration
            </p>
            <h1 className="text-2xl leading-tight font-semibold text-hope-forest">
              System Settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Manage the HOPE Inc. ERP workspace.
            </p>
          </header>
          <article className="rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <h2 className="text-lg font-semibold text-hope-forest">
              Workspace settings
            </h2>
            <p className="mt-2 text-sm text-hope-ink/75">
              System settings are available to Superadmins.
            </p>
            <p className="mt-2 text-sm text-hope-ink/75">Coming soon.</p>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
