import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";

export const instant = false;

export default async function DashboardPage() {
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

  return (
    <main className="min-h-screen bg-hope-ivory px-4 py-8 text-hope-ink sm:px-6">
      <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8">
        <h1 className="text-2xl font-semibold text-hope-forest">
          Welcome, {appUser.first_name}
        </h1>
        <p className="text-sm text-hope-ink/80">Role: {appUser.role_code}</p>
        <form action="/api/auth/logout" method="post">
          <button
            className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
            type="submit"
          >
            Logout
          </button>
        </form>
      </section>
    </main>
  );
}
