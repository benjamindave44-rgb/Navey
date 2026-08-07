"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword } from "@/app/settings/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-navey-ink px-6 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Updating…" : "Update Password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <form action={changePassword} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="currentPassword" className="text-sm font-semibold">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type={showPasswords ? "text" : "password"}
          required
          className="rounded-full border border-black/10 px-4 py-3 text-base sm:text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="newPassword" className="text-sm font-semibold">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type={showPasswords ? "text" : "password"}
          required
          minLength={8}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-semibold">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPasswords ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
        />
        {mismatch && (
          <p className="text-xs font-semibold text-red-700">
            Passwords don&apos;t match.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-navey-ink/60">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
        />
        Show passwords
      </label>

      <SaveButton />
    </form>
  );
}
