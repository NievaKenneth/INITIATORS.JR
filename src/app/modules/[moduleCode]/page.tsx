import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import AppShell from "@/features/app-shell/AppShell";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import { getWorkspaceModules, workspaceModules } from "@/lib/workspace";

async function ModuleContent({
  params,
}: {
  params: Promise<{ moduleCode: string }>;
}) {
  await connection();
  const { moduleCode } = await params;
  const { appUser, isApproved, mustChangePassword } =
    await getCurrentAppUser();

  if (!appUser || !isApproved || appUser.is_blocked) {
    redirect("/login");
  }

  if (mustChangePassword) {
    redirect("/set-password");
  }

  if (!["superadmin", "admin", "user"].includes(appUser.role_code)) {
    redirect("/login");
  }

  const workspaceModule = workspaceModules.find(
    (item) => item.code === moduleCode,
  );
  if (!workspaceModule) {
    notFound();
  }

  const availableModules = await getWorkspaceModules(appUser);
  if (!availableModules.some((item) => item.code === workspaceModule.code)) {
    redirect(appUser.role_code === "user" ? "/user-dashboard" : "/dashboard");
  }

  const dashboardPath =
    appUser.role_code === "user" ? "/user-dashboard" : "/dashboard";

  return (
    <AppShell
      appUser={appUser}
      activePage="module"
      activeModuleCode={workspaceModule.code}
      pageTitle={workspaceModule.title}
    >
      <section aria-labelledby="module-title">
        <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
          Module
        </p>
        <h1
          className="text-[26px] leading-tight font-semibold text-hope-forest"
          id="module-title"
        >
          {workspaceModule.title}
        </h1>
        <div className="mt-6 max-w-2xl rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
          <p className="text-sm leading-6 text-hope-ink/80">
            This module is coming in a later sprint.
          </p>
          <Link
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white no-underline hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
            href={dashboardPath}
          >
            Back to main page
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

export default function ModulePage({
  params,
}: {
  params: Promise<{ moduleCode: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory p-8 text-sm text-hope-ink">
          Loading module...
        </main>
      }
    >
      <ModuleContent params={params} />
    </Suspense>
  );
}
