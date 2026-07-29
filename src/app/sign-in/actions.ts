"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * A Server Action is a public endpoint, so the form's `required` and
 * `minLength` attributes prove nothing -- a request can be posted straight
 * past the browser. Everything the sign-up form asks for is re-checked here.
 *
 * Length is the rule enforced, not a character-class mix: modern guidance
 * favours longer passphrases over forced symbols, and the real protection
 * against weak-but-complex passwords is the leaked-password check in Supabase.
 */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signUpProblem(
  email: string,
  password: string,
  name: string
): string | null {
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  // bcrypt silently ignores anything past 72 bytes, so an unbounded field is
  // a false sense of security as well as a way to waste hashing time.
  if (password.length > MAX_PASSWORD_LENGTH) return "That password is too long.";
  if (password.toLowerCase().includes(email.split("@")[0].toLowerCase())) {
    return "Password can't contain your email name.";
  }
  if (name.length > 60) return "Name is too long.";
  return null;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?mode=signin&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  // Normalised so Ben@x.com and ben@x.com can't become two accounts.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const problem = signUpProblem(email, password, name);
  if (problem) {
    redirect(`/sign-in?mode=signup&error=${encodeURIComponent(problem)}`);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { display_name: name } : undefined,
    },
  });

  if (error) {
    redirect(`/sign-in?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      `/sign-in?mode=signin&notice=${encodeURIComponent(
        "Check your email to confirm your account, then sign in."
      )}`
    );
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
