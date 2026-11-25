"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type ForgotResponse = {
  errors?: { email?: string };
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const successMessage =
  "If an account exists for this email, a reset link has been sent.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setMessage("");
    setIsSuccess(false);

    const normalizedEmail = email.trim();
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 255) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    let response: Response;
    try {
      response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
    } catch {
      setMessage("Unable to reach the password reset service. Please try again.");
      setIsSubmitting(false);
      return;
    }

    let result: ForgotResponse;
    try {
      result = (await response.json()) as ForgotResponse;
    } catch {
      setMessage("Unable to request a reset link. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    if (!response.ok) {
      setEmailError(result.errors?.email ?? "");
      setMessage(result.message ?? "");
      return;
    }

    setMessage(result.message ?? successMessage);
    setIsSuccess(true);
  }

  const inputClass =
    "min-h-[42px] w-full rounded-[6px] border border-hope-green-2 bg-white px-3 py-2 text-sm text-hope-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2";

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
          aria-labelledby="forgot-title"
        >
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Account access
            </p>
            <h1
              id="forgot-title"
              className="text-2xl leading-tight font-semibold text-hope-forest"
            >
              Forgot password?
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Enter your email address to request a reset link.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="forgot-email"
              >
                Email address
              </label>
              <input
                className={inputClass}
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                aria-invalid={Boolean(emailError)}
                aria-describedby="forgot-email-error"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError("");
                }}
              />
              <p
                className="min-h-4 text-xs text-hope-ink"
                id="forgot-email-error"
                role="alert"
              >
                {emailError}
              </p>
            </div>

            {message ? (
              <p
                className={`rounded-[6px] border-l-[3px] px-3 py-2.5 text-sm ${
                  isSuccess
                    ? "border-hope-green-2 bg-hope-sage text-hope-forest"
                    : "border-hope-gold bg-hope-ivory text-hope-ink"
                }`}
                id="forgot-message"
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
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>

            <p className="text-sm text-hope-ink/80">
              <Link
                className="font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href="/login"
              >
                Return to sign in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
