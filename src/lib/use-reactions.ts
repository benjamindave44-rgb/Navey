"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * One-tap reactions, written from the browser straight to the database.
 *
 * Deliberately not a server action. A server action is a billed function
 * invocation on a hosting plan that has been over its limit once already this
 * year, and a tap on "great coffee" is not worth waking a server for. Going
 * directly to Supabase makes the whole feature cost nothing on Vercel, which is
 * the only reason it is affordable to offer at all.
 *
 * Nothing here is trusted by the database. The function on the other end
 * (toggle_spot_reaction, migration 0040) validates the label, checks the
 * listing is published, and applies its own rate limit, because it is reachable
 * over the API by anyone.
 */

const VOTER_KEY = "navey.voter-key";

/**
 * A random id for this browser, made once and kept.
 *
 * Not an account, not an address, and not a fingerprint -- it identifies a
 * browser to itself so that a second tap removes the first rather than adding
 * another. Someone who clears their storage gets a new one and can vote again;
 * that is a known and accepted hole. This is a mood ring, not an election, and
 * the alternative is putting a sign-in wall in front of the one interaction
 * anybody was ever going to complete.
 */
function voterKey(): string | null {
  try {
    const existing = localStorage.getItem(VOTER_KEY);
    if (existing && existing.length >= 8) return existing;

    const fresh = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, fresh);
    return fresh;
  } catch {
    // Private browsing, or storage switched off. Reactions stop working and
    // nothing else does.
    return null;
  }
}

/** Which labels this browser has already tapped, per spot. Kept locally
 *  because the server does not know who this is, by design. */
function mineKey(spotId: string): string {
  return `navey.reacted.${spotId}`;
}

function readMine(spotId: string): string[] {
  try {
    const raw = localStorage.getItem(mineKey(spotId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeMine(spotId: string, labels: string[]) {
  try {
    localStorage.setItem(mineKey(spotId), JSON.stringify(labels));
  } catch {
    // Nothing to do. The vote still went in; only the highlight is lost.
  }
}

/**
 * "Which of these have I tapped" as an external store.
 *
 * It has to be read through useSyncExternalStore rather than in an effect,
 * because localStorage does not exist while the page renders on the server: the
 * server says "none tapped", the browser may disagree, and this is the one API
 * built for exactly that handover. Snapshots are cached per spot because the
 * hook compares them by identity -- a fresh Set each call would re-render
 * without end.
 */
const listeners = new Set<() => void>();
const snapshots = new Map<string, ReadonlySet<string>>();
const EMPTY: ReadonlySet<string> = new Set<string>();

function getMine(spotId: string): ReadonlySet<string> {
  const cached = snapshots.get(spotId);
  if (cached) return cached;

  const labels = readMine(spotId);
  const fresh = labels.length === 0 ? EMPTY : new Set(labels);
  snapshots.set(spotId, fresh);
  return fresh;
}

function setMine(spotId: string, labels: ReadonlySet<string>, persist: boolean) {
  snapshots.set(spotId, labels);
  if (persist) writeMine(spotId, [...labels]);
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export type ReactionState = {
  counts: Record<string, number>;
  mine: ReadonlySet<string>;
  pending: string | null;
  toggle: (label: string) => void;
};

export function useReactions(
  spotId: string,
  /** Tallies rendered into the page when it was built. Up to a week stale on a
   *  cached page, which is fine for a mood signal -- and the visitor's own tap
   *  is applied on top immediately, so the thing they just did looks done. */
  initialCounts: Record<string, number>
): ReactionState {
  const [counts, setCounts] = useState(initialCounts);
  const [pending, setPending] = useState<string | null>(null);
  const mine = useSyncExternalStore(
    subscribe,
    () => getMine(spotId),
    () => EMPTY
  );

  const toggle = useCallback(
    (label: string) => {
      if (pending) return;

      const key = voterKey();
      if (!key) return;

      const before = getMine(spotId);
      const wasMine = before.has(label);

      const next = new Set(before);
      if (wasMine) next.delete(label);
      else next.add(label);

      // Applied before the round trip, so the button responds to the tap
      // rather than to the network. Not written to storage yet: if the database
      // refuses, nothing should have been remembered.
      setMine(spotId, next, false);
      setCounts((current) => ({
        ...current,
        [label]: Math.max(0, (current[label] ?? 0) + (wasMine ? -1 : 1)),
      }));
      setPending(label);

      const supabase = createBrowserSupabaseClient();
      supabase
        .rpc("toggle_spot_reaction", {
          p_spot_id: spotId,
          p_voter_key: key,
          p_label: label,
        })
        .then(({ data, error }) => {
          setPending(null);

          // -1 means the database refused: rate limited, unknown label, or a
          // listing that is not published. Put the optimistic change back.
          if (error || data === null || data < 0) {
            setMine(spotId, before, false);
            setCounts((current) => ({
              ...current,
              [label]: Math.max(0, (current[label] ?? 0) + (wasMine ? 1 : -1)),
            }));
            return;
          }

          // The database's own count wins over the guess, and only now is the
          // tap remembered for next time.
          setCounts((current) => ({ ...current, [label]: data }));
          setMine(spotId, next, true);
        });
    },
    [pending, spotId]
  );

  return { counts, mine, pending, toggle };
}
