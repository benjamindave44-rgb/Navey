"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signIn, signUp } from "@/app/sign-in/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordStrength(password: string): { label: string; bars: number } {
  if (!password) return { label: "", bars: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return { label: labels[score], bars: score };
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-navey-ink px-5 py-3 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

export function SignInForm({
  initialMode,
  error,
  notice,
}: {
  initialMode: "signin" | "signup";
  error?: string;
  notice?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const strength = passwordStrength(password);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex rounded-full bg-navey-band p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "signin" ? "bg-navey-ink text-navey-yellow" : ""
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 transition-colors ${
            mode === "signup" ? "bg-navey-ink text-navey-yellow" : ""
          }`}
        >
          Sign up
        </button>
      </div>

      <h1 className="font-heading text-2xl font-extrabold">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-navey-ink/70">
        {mode === "signin"
          ? "Sign in to save spots and write reviews."
          : "Join Navey to save spots, write reviews, and submit hidden gems."}
      </p>

      {/* Apple sign-in needs a paid Apple Developer membership, so it is
          left out rather than shown as a button that cannot work. */}
      <div className="mt-6 flex flex-col gap-2">
        <GoogleSignInButton />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-navey-ink/40">
        <div className="h-px flex-1 bg-black/10" />
        or
        <div className="h-px flex-1 bg-black/10" />
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-navey-band px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        key={mode}
        action={mode === "signin" ? signIn : signUp}
        className="flex flex-col gap-3"
      >
        {mode === "signup" && (
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            className="rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-navey-ink"
          />
        )}
        <div className="relative">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-full border border-black/10 px-4 py-3 pr-9 text-sm outline-none focus:border-navey-ink"
          />
          {emailValid && (
            <span
              aria-hidden
              className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
            >
              ✓
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-full border border-black/10 px-4 py-3 pr-16 text-sm outline-none focus:border-navey-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-navey-ink/60"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {mode === "signup" && password && (
          <div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className={`h-1 flex-1 rounded-full ${
                    bar < strength.bars ? "bg-navey-ink" : "bg-black/10"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-navey-ink/50">{strength.label}</p>
          </div>
        )}

        {mode === "signin" && (
          <Link
            href="/forgot-password"
            className="self-end text-xs font-semibold text-navey-ink/60 hover:text-navey-ink"
          >
            Forgot?
          </Link>
        )}

        <SubmitButton label={mode === "signin" ? "Sign in" : "Sign up"} />
      </form>

      <p className="mt-6 text-center text-sm text-navey-ink/60">
        {mode === "signin" ? (
          <>
            New to Navey?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-semibold text-navey-ink hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-semibold text-navey-ink hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-navey-ink/40">
        By continuing you agree to Navey&apos;s{" "}
        <Link href="/terms" className="underline hover:text-navey-ink">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-navey-ink">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
