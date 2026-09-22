"use client";

import { useState } from "react";

/**
 * One question, one tap, and an answer that can be taken back.
 *
 * Built this way because of a measured problem rather than a preference: of
 * around fifty listings, thirty-eight had no seating style and eighteen no
 * noise level. Those fields have existed for months. They are empty because
 * filling them meant opening a dropdown, and a form that takes three minutes
 * per listing does not get filled in by one person maintaining a directory
 * alone in the evenings.
 *
 * So: chips, not a select. Tapping the chip that is already on clears it, which
 * matters because "I do not know" has to stay reachable -- a field nobody has
 * checked must be able to go back to empty, or the first mistap becomes
 * permanent. Empty is a real answer here and the public pages render nothing at
 * all for it.
 */
export function ChoiceChips({
  name,
  label,
  hint,
  options,
  initialValue,
}: {
  name: string;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-navey-ink/50">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              // Tapping the active chip clears the field back to "not checked".
              onClick={() => setValue(active ? "" : option.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-navey-ink text-navey-yellow"
                  : "bg-navey-band text-navey-ink hover:bg-navey-band/70"
              }`}
            >
              {option.label}
            </button>
          );
        })}
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-full px-2 py-1.5 text-xs font-semibold text-navey-ink/40 hover:text-navey-ink"
          >
            clear
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

/** Yes, no, or nobody has checked -- which is not the same as no. */
export function YesNoChips({
  name,
  label,
  hint,
  initialValue,
}: {
  name: string;
  label: string;
  hint?: string;
  /** "yes", "no", or "" for unchecked. */
  initialValue: string;
}) {
  return (
    <ChoiceChips
      name={name}
      label={label}
      hint={hint}
      initialValue={initialValue}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
    />
  );
}

/** Turns a nullable boolean from the database into what the chips expect. */
export function yesNoValue(value: boolean | null | undefined): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}
