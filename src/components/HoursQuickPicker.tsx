"use client";

import { useState } from "react";
import { TIME_OPTIONS } from "@/lib/hours";

/**
 * Most shops keep the same hours all week, or one set on weekdays and another
 * at the weekend. Making someone fill fourteen fields to say that is what kept
 * hours off most listings. The common cases are one choice and two dropdowns;
 * the per-day grid is still there for the shops that need it.
 */
type Mode = "skip" | "same" | "split" | "always" | "custom";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "same", label: "Same every day", hint: "One set of hours, all week" },
  { value: "split", label: "Weekdays & weekend", hint: "Two sets of hours" },
  { value: "always", label: "Open 24/7", hint: "Never closes" },
  { value: "custom", label: "Different each day", hint: "Set all seven" },
  { value: "skip", label: "Add later", hint: "Skip for now" },
];

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

const DEFAULT_OPEN = "8:00 AM";
const DEFAULT_CLOSE = "9:00 PM";

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-full border border-black/10 px-3 py-2 text-xs font-normal outline-none focus:border-navey-ink"
      >
        {TIME_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Emitted under the same field names the owner's Hours tab uses, so one
 *  parser on the server handles both. */
function DayFields({
  day,
  closed,
  always,
  open,
  close,
}: {
  day: number;
  closed?: boolean;
  always?: boolean;
  open?: string;
  close?: string;
}) {
  return (
    <>
      {closed && <input type="hidden" name={`closed_${day}`} value="on" />}
      {always && <input type="hidden" name={`hours24_${day}`} value="on" />}
      {!closed && !always && (
        <>
          <input type="hidden" name={`open_${day}`} value={open ?? ""} />
          <input type="hidden" name={`close_${day}`} value={close ?? ""} />
        </>
      )}
    </>
  );
}

export function HoursQuickPicker() {
  const [mode, setMode] = useState<Mode>("same");

  const [open, setOpen] = useState(DEFAULT_OPEN);
  const [close, setClose] = useState(DEFAULT_CLOSE);

  const [weekdayOpen, setWeekdayOpen] = useState(DEFAULT_OPEN);
  const [weekdayClose, setWeekdayClose] = useState(DEFAULT_CLOSE);
  const [weekendOpen, setWeekendOpen] = useState("9:00 AM");
  const [weekendClose, setWeekendClose] = useState("10:00 PM");

  const [perDay, setPerDay] = useState(() =>
    Array.from({ length: 7 }, () => ({
      state: "open" as "open" | "closed" | "always",
      open: DEFAULT_OPEN,
      close: DEFAULT_CLOSE,
    }))
  );

  function setDay(day: number, patch: Partial<(typeof perDay)[number]>) {
    setPerDay((current) =>
      current.map((entry, index) =>
        index === day ? { ...entry, ...patch } : entry
      )
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Opening hours</p>

      <div className="flex flex-wrap gap-2">
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            title={option.hint}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              mode === option.value
                ? "bg-navey-ink text-navey-yellow"
                : "bg-navey-band hover:bg-navey-band/70"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {mode === "same" && (
          <>
            <div className="flex flex-wrap gap-3">
              <TimeSelect label="Opens" value={open} onChange={setOpen} />
              <TimeSelect label="Closes" value={close} onChange={setClose} />
            </div>
            {Array.from({ length: 7 }, (_, day) => (
              <DayFields key={day} day={day} open={open} close={close} />
            ))}
          </>
        )}

        {mode === "split" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs font-bold text-navey-ink/60">
                Monday to Friday
              </p>
              <div className="flex flex-wrap gap-3">
                <TimeSelect
                  label="Opens"
                  value={weekdayOpen}
                  onChange={setWeekdayOpen}
                />
                <TimeSelect
                  label="Closes"
                  value={weekdayClose}
                  onChange={setWeekdayClose}
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-navey-ink/60">
                Saturday & Sunday
              </p>
              <div className="flex flex-wrap gap-3">
                <TimeSelect
                  label="Opens"
                  value={weekendOpen}
                  onChange={setWeekendOpen}
                />
                <TimeSelect
                  label="Closes"
                  value={weekendClose}
                  onChange={setWeekendClose}
                />
              </div>
            </div>
            {WEEKDAYS.map((day) => (
              <DayFields
                key={day}
                day={day}
                open={weekdayOpen}
                close={weekdayClose}
              />
            ))}
            {WEEKEND.map((day) => (
              <DayFields
                key={day}
                day={day}
                open={weekendOpen}
                close={weekendClose}
              />
            ))}
          </div>
        )}

        {mode === "always" && (
          <>
            <p className="text-xs text-navey-ink/60">
              Open all day and all night, every day.
            </p>
            {Array.from({ length: 7 }, (_, day) => (
              <DayFields key={day} day={day} always />
            ))}
          </>
        )}

        {mode === "custom" && (
          <div className="flex flex-col gap-3">
            {DAY_LABELS.map((label, day) => {
              const entry = perDay[day];
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-end gap-3 rounded-2xl bg-navey-band/40 p-3"
                >
                  <span className="w-20 text-xs font-bold">{label}</span>
                  <div className="flex overflow-hidden rounded-full border border-black/10">
                    {(["open", "always", "closed"] as const).map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => setDay(day, { state })}
                        aria-pressed={entry.state === state}
                        className={`px-3 py-1.5 text-[11px] font-semibold ${
                          entry.state === state
                            ? "bg-navey-ink text-navey-yellow"
                            : "bg-white text-navey-ink/60"
                        }`}
                      >
                        {state === "open"
                          ? "Hours"
                          : state === "always"
                            ? "24h"
                            : "Closed"}
                      </button>
                    ))}
                  </div>
                  {entry.state === "open" && (
                    <div className="flex flex-1 flex-wrap gap-2">
                      <TimeSelect
                        label="Opens"
                        value={entry.open}
                        onChange={(value) => setDay(day, { open: value })}
                      />
                      <TimeSelect
                        label="Closes"
                        value={entry.close}
                        onChange={(value) => setDay(day, { close: value })}
                      />
                    </div>
                  )}
                  <DayFields
                    day={day}
                    closed={entry.state === "closed"}
                    always={entry.state === "always"}
                    open={entry.open}
                    close={entry.close}
                  />
                </div>
              );
            })}
          </div>
        )}

        {mode === "skip" && (
          <p className="text-xs text-navey-ink/60">
            No hours saved. You can add them any time from Manage Listings —
            though hours are one of the two things people check before leaving
            the house.
          </p>
        )}
      </div>
    </div>
  );
}
