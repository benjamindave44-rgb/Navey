"use client";

import { useMemo, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

export function PhotoPicker({
  name,
  max,
  aspect = "aspect-square",
  helpText,
  accept = "image/*",
}: {
  name: string;
  max: number;
  aspect?: string;
  helpText?: string;
  /** Menus also take PDFs; galleries stay images-only. */
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [working, setWorking] = useState(false);

  function syncHiddenInput(list: File[]) {
    const dt = new DataTransfer();
    list.forEach((file) => dt.items.add(file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    setWorking(true);
    try {
      const room = Math.max(0, max - files.length);
      const shrunk = await Promise.all(
        picked.slice(0, room).map((file) => compressImage(file))
      );
      const next = [...files, ...shrunk].slice(0, max);
      setFiles(next);
      syncHiddenInput(next);
    } finally {
      setWorking(false);
    }
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
            {file.type === "application/pdf" ? (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                <span aria-hidden className="text-2xl">
                  📄
                </span>
                <span className="line-clamp-2 text-[10px] font-semibold text-navey-ink/70">
                  {file.name}
                </span>
              </span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a served asset */
              <img
                src={previews[index]}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
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
              accept={accept}
              multiple
              className="hidden"
              onChange={handlePick}
            />
          </label>
        )}
      </div>
      <input ref={inputRef} type="file" name={name} multiple hidden />
      <p className="mt-2 text-xs text-navey-ink/50">
        {working
          ? "Preparing photos…"
          : helpText ??
            `Up to ${max} photos. Large photos are resized automatically.`}
      </p>
    </div>
  );
}
