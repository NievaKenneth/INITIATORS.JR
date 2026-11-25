"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type RegistrationField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword";

type RegistrationFields = Record<RegistrationField, string>;
type RegistrationErrors = Partial<Record<RegistrationField, string>>;
type RegistrationResponse = {
  errors?: RegistrationErrors;
  message?: string;
};

const initialFields: RegistrationFields = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordRule =
  "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";

function validate(fields: RegistrationFields): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!fields.firstName.trim()) {
    errors.firstName = "Enter your first name.";
  } else if (fields.firstName.trim().length > 100) {
    errors.firstName = "First name must be 100 characters or fewer.";
  }

  if (!fields.lastName.trim()) {
    errors.lastName = "Enter your last name.";
  } else if (fields.lastName.trim().length > 100) {
    errors.lastName = "Last name must be 100 characters or fewer.";
  }

  const email = fields.email.trim();
  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > 255 || !emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Enter a password.";
  } else if (!passwordPattern.test(fields.password)) {
    errors.password = passwordRule;
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function RegisterPage() {
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field: RegistrationField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
    setIsSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    const validationErrors = validate(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    let response: Response;
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim(),
          password: fields.password,
          confirmPassword: fields.confirmPassword,
        }),
      });
    } catch {
      setMessage("Unable to reach the registration service. Please try again.");
      setIsSubmitting(false);
      return;
    }

    let result: RegistrationResponse;
    try {
      result = (await response.json()) as RegistrationResponse;
    } catch {
      setMessage("Registration could not be completed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (!response.ok) {
      setErrors(result.errors ?? {});
      setMessage(result.message ?? "");
      return;
    }

    setMessage(
      result.message ??
        "Check your email to confirm your account. An admin must also approve it before you can sign in.",
    );
    setIsSuccess(true);
  }

  const fieldClass =
    "min-h-[42px] w-full rounded-[6px] border border-hope-green-2 bg-white px-3 py-2 text-sm text-hope-ink placeholder:text-hope-ink/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2";
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
          aria-labelledby="register-title"
        >
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Account access
            </p>
            <h1
              id="register-title"
              className="text-2xl leading-tight font-semibold text-hope-forest"
            >
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Request access to the HOPE Inc. ERP workspace.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-1.5">
                <label
                  className="text-xs font-semibold text-hope-ink"
                  htmlFor="register-first-name"
                >
                  First name
                </label>
                <input
                  className={fieldClass}
                  id="register-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                  value={fields.firstName}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby="register-first-name-error"
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                />
                <p
                  className={errorClass}
                  id="register-first-name-error"
                  role="alert"
                >
                  {errors.firstName}
                </p>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label
                  className="text-xs font-semibold text-hope-ink"
                  htmlFor="register-last-name"
                >
                  Last name
                </label>
                <input
                  className={fieldClass}
                  id="register-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  maxLength={100}
                  required
                  value={fields.lastName}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby="register-last-name-error"
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                />
                <p
                  className={errorClass}
                  id="register-last-name-error"
                  role="alert"
                >
                  {errors.lastName}
                </p>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="register-email"
              >
                Email address
              </label>
              <input
                className={fieldClass}
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                required
                value={fields.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="register-email-error"
                onChange={(event) => updateField("email", event.target.value)}
              />
              <p className={errorClass} id="register-email-error" role="alert">
                {errors.email}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="register-password"
              >
                Password
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  className={fieldClass}
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={fields.password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="register-password-hint register-password-error"
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                />
                <button
                  className="min-h-[42px] shrink-0 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
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
                id="register-password-hint"
              >
                At least 8 characters, with uppercase, lowercase, and number.
              </p>
              <p
                className={errorClass}
                id="register-password-error"
                role="alert"
              >
                {errors.password}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                className="text-xs font-semibold text-hope-ink"
                htmlFor="register-confirm"
              >
                Confirm password
              </label>
              <input
                className={fieldClass}
                id="register-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={fields.confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby="register-confirm-error"
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
              />
              <p
                className={errorClass}
                id="register-confirm-error"
                role="alert"
              >
                {errors.confirmPassword}
              </p>
            </div>

            <p className="rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-xs leading-5 text-hope-ink">
              New accounts are User accounts and remain pending until an
              administrator approves them.
            </p>

            {message ? (
              <p
                className={`rounded-[6px] border-l-[3px] px-3 py-2.5 text-sm ${
                  isSuccess
                    ? "border-hope-green-2 bg-hope-sage text-hope-forest"
                    : "border-hope-gold bg-hope-ivory text-hope-ink"
                }`}
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-sm text-hope-ink/80">
              Already have an account?{" "}
              <a
                className="font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                href="/login"
              >
                Sign in
              </a>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
