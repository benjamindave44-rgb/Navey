"use client";

import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/forgot-password/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-navey-ink px-5 py-3.5 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm({
  sent,
  error,
}: {
  sent?: string;
  error?: string;
}) {
  if (sent) {
    return (
      <div className="py-2 text-center">
        <div className="mb-3.5 text-4xl" aria-hidden>
          📧
        </div>
        <h1 className="font-heading text-xl font-extrabold">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-navey-ink/65">
          If an account exists for <span className="font-bold text-navey-ink">{sent}</span>,
          we&apos;ve sent a password reset link. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center font-heading text-xl font-extrabold">
        Reset your password
      </h1>
      <p className="mt-2 text-center text-sm text-navey-ink/65">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>

      <form action={requestPasswordReset} className="mt-6 flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@gmail.com"
            required
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-700">{error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
