"use client";

export function DeleteReviewButton({ author }: { author: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete this review by ${author}? It disappears from the spot page and the rating recalculates. This can't be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
      className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
    >
      Delete review
    </button>
  );
}
