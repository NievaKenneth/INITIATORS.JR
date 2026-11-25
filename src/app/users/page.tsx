import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import { getWorkspaceModuleAccess } from "@/lib/workspace";
import AppShell from "@/features/app-shell/AppShell";
import UserManagementClient from "@/features/user-management/UserManagementClient";

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory px-4 py-8 text-hope-ink sm:px-6">
          <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
            <p className="text-sm text-hope-ink/80">
              Loading user management...
            </p>
          </section>
        </main>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}

async function UsersPageContent() {
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

  if (
    appUser.role_code !== "admin" &&
    appUser.role_code !== "superadmin"
  ) {
    redirect("/login");
  }

  const moduleAccess = await getWorkspaceModuleAccess(appUser);

  return (
    <AppShell appUser={appUser} moduleAccess={moduleAccess} currentPath="/users">
      <UserManagementClient
        actorRole={appUser.role_code}
        actorUserId={appUser.user_id}
      />
    </AppShell>
  );
}
