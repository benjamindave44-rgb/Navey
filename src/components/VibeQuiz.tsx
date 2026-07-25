"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = {
  value: string;
  icon: string;
  label: string;
  tag?: string;
};

type Question = {
  id: string;
  title: string;
  subtitle: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    id: "mood",
    title: "What's the mood today?",
    subtitle: "Pick what fits how you want to feel.",
    options: [
      { value: "chill", icon: "😌", label: "Chill & quiet", tag: "Chill" },
      { value: "work", icon: "💻", label: "Focused & productive", tag: "Work Friendly" },
      { value: "social", icon: "🎉", label: "Social & lively" },
      { value: "romantic", icon: "💕", label: "Romantic date", tag: "Date Spot" },
    ],
  },
  {
    id: "need",
    title: "What do you need most?",
    subtitle: "We'll prioritize spots that have it.",
    options: [
      { value: "wifi", icon: "📶", label: "Fast WiFi", tag: "WiFi" },
      { value: "charging", icon: "🔌", label: "Charging outlets", tag: "Charging" },
      { value: "petfriendly", icon: "🐾", label: "Pet friendly", tag: "Pet Friendly" },
      { value: "hidden", icon: "💎", label: "Somewhere new", tag: "Hidden Gems" },
    ],
  },
  {
    id: "extra",
    title: "Anything else important?",
    subtitle: "Last one — then we'll match you with spots.",
    options: [
      { value: "late", icon: "🌙", label: "Open late", tag: "24 Hours" },
      { value: "restroom", icon: "🚻", label: "Clean restroom", tag: "Comfort Room" },
      { value: "pwd", icon: "♿", label: "PWD friendly", tag: "PWD Friendly" },
      { value: "any", icon: "🤷", label: "No preference" },
    ],
  },
];

const VIBE_NAMES: Record<string, string> = {
  chill: "The Quiet Wanderer",
  work: "The Focused Explorer",
  social: "The Social Butterfly",
  romantic: "The Romantic",
};

export function VibeQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = QUESTIONS[step];

  function selectOption(option: Option) {
    const nextAnswers = { ...answers, [question.id]: option.value };
    setAnswers(nextAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    const tags = QUESTIONS.flatMap((q) => {
      const chosen = q.options.find((o) => o.value === nextAnswers[q.id]);
      return chosen?.tag ? [chosen.tag] : [];
    });
    const vibe = VIBE_NAMES[nextAnswers.mood] ?? "The Explorer";

    const params = new URLSearchParams();
    if (tags.length > 0) params.set("tags", tags.join(","));
    params.set("vibe", vibe);
    router.push(`/onboarding/results?${params.toString()}`);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-6 py-8">
      <div className="mb-8 w-full">
        <div className="mb-2 flex gap-1.5">
          {QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-navey-ink/10"
            >
              <div
                className="h-full rounded-full bg-navey-ink transition-all duration-300"
                style={{ width: i < step ? "100%" : i === step ? "40%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-semibold text-navey-ink/55">
          Question {step + 1} of {QUESTIONS.length}
        </p>
      </div>

      <div
        key={question.id}
        className="flex w-full flex-col items-center"
        style={{ animation: "vibeStepIn 0.3s ease both" }}
      >
        <h1 className="mb-2 text-center font-heading text-3xl font-extrabold tracking-tight">
          {question.title}
        </h1>
        <p className="mb-8 text-center text-sm text-navey-ink/65">
          {question.subtitle}
        </p>

        <div className="grid w-full grid-cols-2 gap-3.5">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectOption(option)}
              className="flex flex-col items-start gap-2 rounded-2xl border-2 border-black/10 bg-white p-5 text-left transition-transform hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(20,18,11,0.12)]"
            >
              <span className="text-3xl" aria-hidden>
                {option.icon}
              </span>
              <span className="font-heading text-base font-bold">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="mt-7 flex items-center gap-1.5 text-sm font-bold text-navey-ink/55 hover:text-navey-ink"
          >
            ← Back
          </button>
        )}
      </div>

      <style>{`
        @keyframes vibeStepIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
