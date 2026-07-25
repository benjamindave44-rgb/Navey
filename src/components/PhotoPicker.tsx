"use client";

import { useMemo, useRef, useState } from "react";

export function PhotoPicker({
  name,
  max,
  aspect = "aspect-square",
  helpText,
}: {
  name: string;
  max: number;
  aspect?: string;
  helpText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function syncHiddenInput(list: File[]) {
    const dt = new DataTransfer();
    list.forEach((file) => dt.items.add(file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    const next = [...files, ...picked].slice(0, max);
    setFiles(next);
    syncHiddenInput(next);
    event.target.value = "";
  }

  function remove(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncHiddenInput(next);
  }

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className={`relative ${aspect} overflow-hidden rounded-xl bg-navey-band`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a served asset */}
            <img
              src={previews[index]}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < max && (
          <label
            className={`flex ${aspect} cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-black/15 text-2xl text-navey-ink/30 hover:border-navey-ink/30`}
          >
            +
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handlePick}
            />
          </label>
        )}
      </div>
      <input ref={inputRef} type="file" name={name} multiple hidden />
      <p className="mt-2 text-xs text-navey-ink/50">
        {helpText ?? `Up to ${max} photos, 5MB each (JPEG, PNG, or WebP).`}
      </p>
    </div>
  );
}
