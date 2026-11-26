import { Suspense } from "react";
import RoleDashboard from "@/features/app-shell/RoleDashboard";

export const instant = false;

export default function UserDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-hope-ivory p-8 text-sm text-hope-ink">
          Loading your workspace...
        </main>
      }
    >
      <RoleDashboard audience="user" />
    </Suspense>
  );
}
