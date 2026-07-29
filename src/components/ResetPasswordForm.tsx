"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword } from "@/app/reset-password/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-navey-ink px-5 py-3.5 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export function ResetPasswordForm({ error }: { error?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div>
      <h1 className="text-center font-heading text-xl font-extrabold">
        Set a new password
      </h1>
      <p className="mt-2 text-center text-sm text-navey-ink/65">
        Choose a new password for your account.
      </p>

      <form action={updatePassword} className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="password" className="mb-1.5 block text-xs font-bold">
            New password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 pr-16 text-sm outline-none focus:border-navey-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-[38px] text-xs font-semibold text-navey-ink/60"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-xs font-bold">
            Confirm new password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            name="confirm"
            placeholder="Re-enter new password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
          {mismatch && (
            <p className="mt-1.5 text-xs font-semibold text-red-700">
              Passwords don&apos;t match.
            </p>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

        <SubmitButton />
      </form>
    </div>
  );
}
