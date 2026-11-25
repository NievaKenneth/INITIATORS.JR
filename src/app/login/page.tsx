import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/supabase/profile";
import LoginForm from "./LoginForm";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{
    confirmed?: string;
    error?: string;
    passwordSet?: string;
    passwordUpdated?: string;
  }>;
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
  return (
    <LoginForm
      emailWasConfirmed={params.confirmed === "1"}
      confirmationLinkIsInvalid={params.error === "invalid_link"}
      passwordWasSet={params.passwordSet === "1"}
      passwordWasUpdated={params.passwordUpdated === "1"}
    />
  );
}
