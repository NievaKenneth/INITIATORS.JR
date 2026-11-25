import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import AppShell from "@/features/app-shell/AppShell";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import { getWorkspaceModuleAccess } from "@/lib/workspace";

type ModulePageProps = {
  params: Promise<{ moduleCode: string }>;
};

export default function ModulePage({ params }: ModulePageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 text-hope-ink sm:px-6">
          <section className="mx-auto w-full max-w-3xl rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">Loading module...</p>
          </section>
        </main>
      }
    >
      <ModulePageContent params={params} />
    </Suspense>
  );
}

async function ModulePageContent({ params }: ModulePageProps) {
  await connection();
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (!["user", "admin", "superadmin"].includes(appUser.role_code)) {
    redirect("/login");
  }

  const { moduleCode } = await params;
  const moduleAccess = await getWorkspaceModuleAccess(appUser);
  const workspaceModule = moduleAccess.modules.find(
    (item) => item.moduleCode === moduleCode,
  );
  const dashboardPath =
    appUser.role_code === "user" ? "/user-dashboard" : "/dashboard";

  if (!workspaceModule) {
    redirect(dashboardPath);
  }

  if (
    appUser.role_code === "user" &&
    !moduleAccess.enabledModuleCodes.includes(moduleCode)
  ) {
    redirect("/user-dashboard");
  }

  return (
    <AppShell
      appUser={appUser}
      moduleAccess={moduleAccess}
      currentPath={`/modules/${encodeURIComponent(moduleCode)}`}
    >
      <main className="min-h-[calc(100vh-72px)] px-4 py-8 text-hope-ink sm:px-6 sm:py-10 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Workspace
            </p>
            <h1 className="text-2xl leading-tight font-semibold text-hope-forest">
              {workspaceModule.moduleName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              {workspaceModule.summary}
            </p>
          </header>
          <article className="rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <h2 className="text-lg font-semibold text-hope-forest">
              Coming soon
            </h2>
            <p className="mt-2 text-sm text-hope-ink/75">No data yet.</p>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
