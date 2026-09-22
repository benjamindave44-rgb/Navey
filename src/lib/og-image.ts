import { createElement as h, type ReactElement } from "react";

/**
 * The pictures that appear when a Navey link is pasted into Messenger, Viber,
 * Facebook or Twitter.
 *
 * Two things about this file are deliberate and neither is stylistic.
 *
 * **Why it is separate from the routes.** A route file cannot be imported by a
 * test. This code silently broke every deployment for a month, and the only
 * thing that would have caught it is drawing the picture and seeing it fail —
 * so the drawing has to live somewhere a test can reach. See
 * scripts/og.test.mts.
 *
 * **Why it is written with createElement rather than JSX.** These are drawn by
 * Satori, which is not a browser: it implements a deliberate subset of CSS and
 * refuses anything ambiguous rather than guessing. Its strictest rule is that
 * *any element with more than one child must state its `display`*. Written as
 * JSX, the children of a div are easy to miscount — `{city}{price}` looks like
 * one thing and is two. Written here, every child is a separate argument, so
 * the count is impossible to miss.
 *
 * That exact miscount is what happened: the listing card had a div holding the
 * city and the price range with no `display`. While these routes were drawn on
 * demand it was merely a broken preview image, invisible because nobody looks
 * at their own link previews. Once `generateStaticParams` moved the drawing
 * into the build — right for cost — it became a hard build failure, and four
 * deployments in a row died while the live site quietly stayed a month behind.
 *
 * So: single child, or an explicit `display`. Nothing else.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const FILL = {
  width: "100%",
  height: "100%",
  display: "flex",
} as const;

const CENTRED_YELLOW = {
  ...FILL,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#FFDE00",
  color: "#14120B",
} as const;

/** The plain yellow card, used when a listing has no photo. */
export function brandedCard({
  logoSrc,
  title,
}: {
  logoSrc: string;
  title?: string;
}): ReactElement {
  return h(
    "div",
    { style: CENTRED_YELLOW },
    h("img", { src: logoSrc, alt: "", width: 140, height: 140 }),
    title
      ? h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: 28,
              fontSize: 64,
              fontWeight: 800,
              textAlign: "center",
            },
          },
          title
        )
      : null
  );
}

/** The homepage card. */
export function homeCard({ logoSrc }: { logoSrc: string }): ReactElement {
  return h(
    "div",
    { style: CENTRED_YELLOW },
    h("img", { src: logoSrc, alt: "", width: 160, height: 160 }),
    h(
      "div",
      {
        style: {
          display: "flex",
          marginTop: 28,
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        },
      },
      "NAVEY"
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          marginTop: 12,
          fontSize: 32,
          fontWeight: 600,
          opacity: 0.75,
        },
      },
      "Navigate Good Spots Nearby"
    )
  );
}

/** A listing, over its own photo. */
export function spotCard({
  logoSrc,
  photo,
  name,
  city,
  priceRange,
}: {
  logoSrc: string;
  photo: string;
  name: string;
  city: string;
  priceRange: string | null;
}): ReactElement {
  // One string, not two children sitting beside each other. The second version
  // is what broke the build, and an absent price made it an empty string rather
  // than nothing at all -- which still counts as a child.
  const location = priceRange ? `${city} · ${priceRange}` : city;

  return h(
    "div",
    {
      style: {
        ...FILL,
        position: "relative",
        background: "#14120B",
      },
    },
    h("img", {
      src: photo,
      alt: "",
      width: 1200,
      height: 630,
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0.55,
      },
    }),
    h(
      "div",
      {
        style: {
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 64,
          background:
            "linear-gradient(to top, rgba(20,18,11,0.92), rgba(20,18,11,0.15))",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          },
        },
        h("img", { src: logoSrc, alt: "", width: 56, height: 56 }),
        h(
          "span",
          { style: { fontSize: 32, fontWeight: 800, color: "#FFDE00" } },
          "NAVEY"
        )
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.1,
          },
        },
        name
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            marginTop: 12,
          },
        },
        location
      )
    )
  );
}
