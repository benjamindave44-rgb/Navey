"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/app/newsletter/actions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "bad";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await subscribeToNewsletter(email);
      setFeedback({
        tone: result.status === "error" || result.status === "invalid" ? "bad" : "ok",
        message: result.message,
      });
      if (result.status === "ok") setEmail("");
    });
  }

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-2 rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow hover:bg-navey-ink/80 disabled:opacity-60"
        >
          {pending ? "Joining…" : "Subscribe"}
          <span aria-hidden>✈️</span>
        </button>
      </form>
      {feedback && (
        <p
          className={`mt-2 px-3 text-sm font-semibold ${
            feedback.tone === "ok" ? "text-green-700" : "text-red-600"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
