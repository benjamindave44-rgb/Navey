"use client";

import { useMemo, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import {
  UPLOAD_LIMIT_LABEL,
  formatBytes,
  withinUploadBudget,
} from "@/lib/upload-limits";

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
  const [tooLarge, setTooLarge] = useState<string | null>(null);
  // Shown while photos are being prepared. Silence during a slow step is what
  // makes people tap again or give up; a count that moves does not.
  const [progress, setProgress] = useState({ done: 0, total: 0 });

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
    setTooLarge(null);
    try {
      const room = Math.max(0, max - files.length);
      const queue = picked.slice(0, room);
      setProgress({ done: 0, total: queue.length });

      // Two at a time. Decoding a phone photo is heavy, and starting all of
      // them together spikes memory enough on a mid-range phone to stall the
      // page -- which reads as the upload being slow. Two keeps the work
      // overlapping without the stall.
      const shrunk: File[] = [];
      for (let index = 0; index < queue.length; index += 2) {
        const batch = await Promise.all(
          queue.slice(index, index + 2).map((file) => compressImage(file))
        );
        shrunk.push(...batch);
        setProgress({ done: shrunk.length, total: queue.length });
      }

      // Checked after resizing, so a big photo is judged on what will actually
      // be sent rather than what came off the camera. PDFs are unchanged by
      // that step, which is why they are the ones that hit this.
      const { accepted, rejected } = withinUploadBudget(files, shrunk);
      if (rejected.length > 0) {
        setTooLarge(
          rejected
            .map((file) => `${file.name} (${formatBytes(file.size)})`)
            .join(", ")
        );
      }
      if (accepted.length === 0) return;

      const next = [...files, ...accepted].slice(0, max);
      setFiles(next);
      syncHiddenInput(next);
    } finally {
      setWorking(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  function remove(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncHiddenInput(next);
    setTooLarge(null);
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
      {tooLarge && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          Too big to upload: {tooLarge}. Everything here has to fit in{" "}
          {UPLOAD_LIMIT_LABEL} altogether. For a large PDF menu, take photos of
          the menu instead, or shrink the PDF first.
        </p>
      )}
      <p className="mt-2 text-xs text-navey-ink/50">
        {working
          ? progress.total > 1
            ? `Preparing photo ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
            : "Preparing photo…"
          : helpText ??
            `Up to ${max} photos. Large photos are resized automatically.`}
      </p>
    </div>
  );
}
