"use client";

import { useSyncExternalStore } from "react";

/**
 * Saving things before you have an account.
 *
 * Tapping the heart while signed out used to throw the visitor at the sign-in
 * page, having done nothing with the thing they were trying to keep. The
 * numbers say how that goes: four accounts and two saves. Somebody two minutes
 * into their first visit does not want an account -- they want to remember one
 * cafe -- and asking for the account first loses both.
 *
 * So the save happens immediately, in their own browser, and the account
 * becomes the way to keep it rather than the price of making it. When they do
 * sign in, whatever they collected comes with them (see GuestSaveImporter).
 *
 * Kept in localStorage, which means it is per-browser and can vanish -- a
 * private window, cleared site data, a different phone. Every read is wrapped,
 * because in a private window the accessor itself can throw rather than simply
 * returning nothing.
 */

const KEY = "navey.guest-saves";

/** Enough to be useful, bounded so nothing can fill somebody's storage. */
const MAX_GUEST_SAVES = 100;

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_GUEST_SAVES)));
  } catch {
    // Storage unavailable or full. The heart will not stick, and nothing else
    // on the page is affected.
  }
}

/**
 * An external store rather than component state.
 *
 * Every heart on the page has to agree, and they are separate components with
 * no parent between them. This is also what makes the list safe to read at all:
 * localStorage does not exist while the page is being rendered on the server,
 * so the value has to arrive through the one API that expects the server and
 * the browser to disagree on the first render -- useSyncExternalStore, with a
 * server snapshot of "nothing saved".
 */
const listeners = new Set<() => void>();

/** Cached because useSyncExternalStore compares snapshots by identity: building
 *  a fresh Set on every call would look like a change every time and re-render
 *  for ever. */
let snapshot: ReadonlySet<string> | null = null;

/** One stable empty set, used on the server and before anything is saved. */
const EMPTY: ReadonlySet<string> = new Set<string>();

function getSnapshot(): ReadonlySet<string> {
  if (!snapshot) {
    const ids = read();
    snapshot = ids.length === 0 ? EMPTY : new Set(ids);
  }
  return snapshot;
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

function changed() {
  snapshot = null;
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab of the same site saving something counts too.
  window.addEventListener("storage", changed);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.removeEventListener("storage", changed);
  };
}

export function guestSavedIds(): string[] {
  return read();
}

/** Returns whether the spot is now saved. */
export function toggleGuestSave(spotId: string): boolean {
  const current = read();
  const has = current.includes(spotId);

  write(has ? current.filter((id) => id !== spotId) : [spotId, ...current]);
  changed();

  return !has;
}

export function clearGuestSaves() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
  changed();
}

/** The guest list, kept in step across every heart on the page. */
export function useGuestSaves(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
