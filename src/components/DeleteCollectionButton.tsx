"use client";

export function DeleteCollectionButton({ title }: { title: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete the collection "${title}"? The spots inside it stay on Navey. This can't be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
      className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
    >
      Delete collection
    </button>
  );
}
