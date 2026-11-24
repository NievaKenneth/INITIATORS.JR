import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import LoginForm from "./LoginForm";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ passwordSet?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { appUser, isApproved } = await getCurrentAppUser();

  if (appUser && isApproved && !appUser.is_blocked) {
    redirect(
      appUser.role_code === "admin" || appUser.role_code === "superadmin"
        ? "/dashboard"
        : "/user-dashboard",
    );
  }

  const params = await searchParams;
  return <LoginForm passwordWasSet={params.passwordSet === "1"} />;
}
