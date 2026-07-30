"use client";

import { useState } from "react";

/**
 * A day is one of three things, never a combination — so it's a single choice,
 * not a pile of checkboxes the owner has to reason about. Typing
 * "12:00 AM – 11:59 PM" seven times is not how anyone says "we never close".
 */
type DayMode = "open" | "always" | "closed";

export type EditorHour = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  is24Hours: boolean;
};

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MODES: { value: DayMode; label: string }[] = [
  { value: "open", label: "Set hours" },
  { value: "always", label: "24 hours" },
  { value: "closed", label: "Closed" },
];

function modeOf(hour: EditorHour | undefined): DayMode {
  if (!hour) return "open";
  if (hour.isClosed) return "closed";
  if (hour.is24Hours) return "always";
  return "open";
}

export function OwnerHoursEditor({ hours }: { hours: EditorHour[] }) {
  const byDay = new Map(hours.map((hour) => [hour.dayOfWeek, hour]));
  const [modes, setModes] = useState<DayMode[]>(() =>
    Array.from({ length: 7 }, (_, day) => modeOf(byDay.get(day)))
  );

  const allAlways = modes.every((mode) => mode === "always");

  function setDay(day: number, mode: DayMode) {
    setModes((current) => current.map((m, i) => (i === day ? mode : m)));
  }

  function toggleAlwaysOpen() {
    setModes(
      allAlways
        ? Array.from({ length: 7 }, (_, day) => modeOf(byDay.get(day)))
        : Array<DayMode>(7).fill("always")
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={toggleAlwaysOpen}
        aria-pressed={allAlways}
        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
          allAlways
            ? "border-navey-ink bg-navey-ink text-navey-yellow"
            : "border-black/10 bg-white hover:border-navey-ink"
        }`}
      >
        <span>
          <span className="block font-heading text-sm font-bold">
            Open 24/7
          </span>
          <span
            className={`block text-xs ${
              allAlways ? "text-navey-yellow/70" : "text-navey-ink/60"
            }`}
          >
            {allAlways
              ? "Every day is set to 24 hours."
              : "Never closes — sets all seven days at once."}
          </span>
        </span>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            allAlways ? "bg-navey-yellow" : "bg-black/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              allAlways ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {DAY_LABELS.map((label, day) => {
        const existing = byDay.get(day);
        const mode = modes[day];

        return (
          <div
            key={day}
            className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(20,18,11,0.08)]"
          >
            {mode === "closed" && (
              <input type="hidden" name={`closed_${day}`} value="on" />
            )}
            {mode === "always" && (
              <input type="hidden" name={`hours24_${day}`} value="on" />
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-semibold">{label}</span>
              <div
                role="group"
                aria-label={`${label} opening hours`}
                className="flex overflow-hidden rounded-full border border-black/10"
              >
                {MODES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDay(day, option.value)}
                    aria-pressed={mode === option.value}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      mode === option.value
                        ? "bg-navey-ink text-navey-yellow"
                        : "bg-white text-navey-ink/60 hover:bg-navey-band"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "open" ? (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  name={`open_${day}`}
                  placeholder="Open (e.g. 8:00 AM)"
                  defaultValue={existing?.openTime ?? ""}
                  aria-label={`${label} opening time`}
                  className="min-w-[140px] flex-1 rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-navey-ink"
                />
                <input
                  type="text"
                  name={`close_${day}`}
                  placeholder="Close (e.g. 9:00 PM)"
                  defaultValue={existing?.closeTime ?? ""}
                  aria-label={`${label} closing time`}
                  className="min-w-[140px] flex-1 rounded-full border border-black/10 px-3 py-2 text-xs outline-none focus:border-navey-ink"
                />
              </div>
            ) : (
              <p className="text-xs text-navey-ink/50">
                {mode === "always" ? "Open all day and all night." : "Not open this day."}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
