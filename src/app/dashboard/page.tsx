import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import { getWorkspaceModuleAccess } from "@/lib/workspace";
import AppShell from "@/features/app-shell/AppShell";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 text-hope-ink sm:px-6">
          <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Loading dashboard...</p>
          </section>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (appUser.role_code === "user") {
    redirect("/user-dashboard");
  }

  if (appUser.role_code !== "superadmin" && appUser.role_code !== "admin") {
    redirect("/login");
  }

  const moduleAccess = await getWorkspaceModuleAccess(appUser);

  return (
    <AppShell appUser={appUser} moduleAccess={moduleAccess} currentPath="/dashboard">
      <main className="min-h-[calc(100vh-72px)] px-4 py-8 text-hope-ink sm:px-6 sm:py-10 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Workspace
            </p>
            <h1 className="text-2xl leading-tight font-semibold text-hope-forest">
              Welcome back, {appUser.first_name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Choose a module to continue your work.
            </p>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {moduleAccess.modules.map((module) => (
              <Link
                className="group flex min-h-[174px] flex-col items-start rounded-[10px] border border-hope-border bg-white p-5 text-left text-hope-ink no-underline shadow-[0_2px_10px_rgb(20_45_39_/_5%)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href={`/modules/${encodeURIComponent(module.moduleCode)}`}
                key={module.moduleCode}
              >
                <span
                  className="mb-4 grid size-10 place-items-center rounded-[6px] bg-hope-sage text-xs font-bold text-hope-forest"
                  aria-hidden="true"
                >
                  {module.glyph}
                </span>
                <strong className="text-[15px] font-semibold text-hope-forest">
                  {module.moduleName}
                </strong>
                <span className="mt-1.5 text-xs leading-[1.45] text-hope-ink/75">
                  {module.summary}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
