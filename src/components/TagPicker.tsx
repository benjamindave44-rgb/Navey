"use client";

import { useState } from "react";
import type { Tag } from "@/lib/queries";

/**
 * Thirty-odd tags in one row is a wall, and a wall gets skimmed and skipped --
 * which is how listings end up with two tags instead of eight. Grouping them
 * turns one long scan into a few short ones, and shows the person what kinds
 * of thing they are being asked about.
 *
 * Groups open on demand rather than all at once, so the form stays short on a
 * phone. Any group holding a selected tag opens itself, so nothing a person
 * chose is ever hidden behind a closed heading.
 */
export function TagPicker({
  tags,
  name = "tagIds",
  initialSelected = [],
}: {
  tags: Tag[];
  name?: string;
  initialSelected?: number[];
}) {
  const [selected, setSelected] = useState<number[]>(initialSelected);

  const groups = tags.reduce<Map<string, Tag[]>>((map, tag) => {
    const list = map.get(tag.group) ?? [];
    list.push(tag);
    map.set(tag.group, list);
    return map;
  }, new Map());

  const [open, setOpen] = useState<string[]>(() => {
    // Start with whatever already has a selection, plus the first group so the
    // control never opens looking like a list of inert headings.
    const withSelection = [...groups.entries()]
      .filter(([, list]) => list.some((tag) => initialSelected.includes(tag.id)))
      .map(([group]) => group);
    const first = [...groups.keys()][0];
    return withSelection.length > 0
      ? withSelection
      : first
        ? [first]
        : [];
  });

  function toggleTag(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id]
    );
  }

  function toggleGroup(group: string) {
    setOpen((current) =>
      current.includes(group)
        ? current.filter((entry) => entry !== group)
        : [...current, group]
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {[...groups.entries()].map(([group, list]) => {
        const isOpen = open.includes(group);
        const chosen = list.filter((tag) => selected.includes(tag.id)).length;

        return (
          <div
            key={group}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-navey-band/40"
            >
              <span className="text-sm font-bold">
                {group}
                {chosen > 0 && (
                  <span className="ml-2 rounded-full bg-navey-ink px-2 py-0.5 text-[11px] font-bold text-navey-yellow">
                    {chosen}
                  </span>
                )}
              </span>
              <span aria-hidden className="text-xs text-navey-ink/40">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-wrap gap-2 border-t border-black/5 p-3">
                {list.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={selected.includes(tag.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-transform active:scale-95 ${
                      selected.includes(tag.id)
                        ? "bg-navey-ink text-navey-yellow"
                        : "bg-navey-band hover:bg-navey-band/60"
                    }`}
                  >
                    {tag.icon && <span aria-hidden>{tag.icon}</span>}
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
