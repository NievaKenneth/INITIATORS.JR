"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginField = "email" | "password";
type LoginErrors = Partial<Record<LoginField, string>>;
type LoginResponse = {
  errors?: LoginErrors;
  message?: string;
  redirectTo?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({
  emailWasConfirmed,
  confirmationLinkIsInvalid,
  passwordWasSet,
  passwordWasUpdated,
}: {
  emailWasConfirmed: boolean;
  confirmationLinkIsInvalid: boolean;
  passwordWasSet: boolean;
  passwordWasUpdated: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState(
    emailWasConfirmed
      ? "Email confirmed. Your account will be ready once an admin approves it."
      : confirmationLinkIsInvalid
        ? "This confirmation link is invalid or has expired."
        : passwordWasUpdated
          ? "Password updated. You can now sign in."
          : passwordWasSet
            ? "Password set. You can now sign in."
            : "",
  );
  const [isSuccess, setIsSuccess] = useState(
    emailWasConfirmed || passwordWasSet || passwordWasUpdated,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      nextErrors.email = "Enter your email address.";
    } else if (
      normalizedEmail.length > 255 ||
      !emailPattern.test(normalizedEmail)
    ) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) nextErrors.password = "Enter your password.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
    } catch {
      setMessage("Unable to reach the sign-in service. Please try again.");
      setIsSubmitting(false);
      return;
    }

    let result: LoginResponse;
    try {
      result = (await response.json()) as LoginResponse;
    } catch {
      setMessage("Unable to complete sign in. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    if (!response.ok) {
      setErrors(result.errors ?? {});
      setMessage(result.message ?? "Unable to complete sign in. Please try again.");
      return;
    }

    if (result.redirectTo) {
      router.replace(result.redirectTo);
      return;
    }

    setMessage("Unable to complete sign in. Please try again.");
  }

  const inputClass =
    "min-h-[42px] w-full rounded-[6px] border border-hope-green-2 bg-white px-3 py-2 text-sm text-hope-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2";
  const errorClass = "min-h-4 text-xs text-hope-ink";

  return (
    <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-[480px]">
        <header className="mb-6 flex items-center justify-center">
          <Link
            className="inline-flex items-center gap-3 text-hope-ink no-underline"
            href="/"
            aria-label="HOPE Inc. ERP home"
          >
            <span className="grid size-[38px] place-items-center rounded-xl bg-hope-gold text-[15px] font-bold text-hope-sidebar">
              H
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.12em]">
                HOPE, INC. ERP
              </span>
              <span className="mt-0.5 block text-xs text-hope-ink/70">
                Enterprise Resource Planning
              </span>
            </span>
          </Link>
        </header>

        <section
          className="rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_2px_10px_rgb(20_45_39_/_5%)] sm:p-8"
          aria-labelledby="login-title"
        >
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Account access
            </p>
            <h1
              id="login-title"
              className="text-2xl leading-tight font-semibold text-hope-forest"
            >
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Welcome back to HOPE Inc. ERP.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="login-email"
              >
                Email address
              </label>
              <input
                className={inputClass}
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="login-email-hint login-email-error"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
              />
              <p
                className="text-xs leading-5 text-hope-ink/75"
                id="login-email-hint"
              >
                Use the email address linked to your account.
              </p>
              <p className={errorClass} id="login-email-error" role="alert">
                {errors.email}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="login-password"
              >
                Password
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  className={inputClass}
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="login-password-error"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                />
                <button
                  className="min-h-[42px] shrink-0 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className={errorClass} id="login-password-error" role="alert">
                {errors.password}
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <Link
                className="font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
              <Link
                className="font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href="/register"
              >
                Don&apos;t have an account? Register
              </Link>
            </div>

            {message ? (
              <p
                className="rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-sm text-hope-ink"
                id="login-message"
                role={isSuccess ? "status" : "alert"}
                aria-live="polite"
              >
                {message}
              </p>
            ) : null}

            <button
              className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
