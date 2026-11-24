"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type PasswordField = "password" | "confirmPassword";
type PasswordErrors = Partial<Record<PasswordField, string>>;
type PasswordResponse = {
  errors?: PasswordErrors;
  message?: string;
  redirectTo?: string;
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordRule =
  "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";

export default function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const nextErrors: PasswordErrors = {};
    if (!password) {
      nextErrors.password = "Enter a password.";
    } else if (!passwordPattern.test(password)) {
      nextErrors.password = passwordRule;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    let response: Response;
    try {
      response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
    } catch {
      setMessage("Unable to reach the password service. Please try again.");
      setIsSubmitting(false);
      return;
    }

    let result: PasswordResponse;
    try {
      result = (await response.json()) as PasswordResponse;
    } catch {
      setMessage("Unable to update your password. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    if (!response.ok) {
      setErrors(result.errors ?? {});
      setMessage(result.message ?? "Unable to update your password. Please try again.");
      return;
    }

    if (result.redirectTo) {
      router.replace(result.redirectTo);
      return;
    }

    setMessage("Unable to update your password. Please try again.");
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
          aria-labelledby="set-password-title"
        >
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Account access
            </p>
            <h1
              id="set-password-title"
              className="text-2xl leading-tight font-semibold text-hope-forest"
            >
              Set your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              For an account created by an administrator.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="first-login-password"
              >
                New password
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  className={inputClass}
                  id="first-login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="first-login-password-hint first-login-password-error"
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
              <p
                className="text-xs leading-5 text-hope-ink/75"
                id="first-login-password-hint"
              >
                At least 8 characters, with uppercase, lowercase, and number.
              </p>
              <p
                className={errorClass}
                id="first-login-password-error"
                role="alert"
              >
                {errors.password}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="first-login-confirm"
              >
                Confirm new password
              </label>
              <input
                className={inputClass}
                id="first-login-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby="first-login-confirm-error"
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }));
                }}
              />
              <p
                className={errorClass}
                id="first-login-confirm-error"
                role="alert"
              >
                {errors.confirmPassword}
              </p>
            </div>

            {message ? (
              <p
                className="rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-sm text-hope-ink"
                role="alert"
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
              {isSubmitting ? "Setting password..." : "Set password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
