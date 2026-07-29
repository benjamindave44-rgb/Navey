"use client";

/**
 * Last resort: catches failures in the root layout itself, where the normal
 * error boundary can't render because the layout never mounted. It has to
 * supply its own html and body for that reason.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#ffde00",
          color: "#14120b",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.5rem",
          margin: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            Navey couldn&apos;t load
          </h1>
          <p style={{ marginTop: "0.5rem", opacity: 0.75 }}>
            Something went wrong on our side.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#14120b",
              color: "#ffde00",
              border: "none",
              borderRadius: "999px",
              padding: "0.75rem 1.5rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
