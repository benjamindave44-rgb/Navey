"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * Who is looking at the page, worked out in the browser rather than on the
 * server.
 *
 * This exists so pages can be cached. A page that asks the server "who is
 * signed in?" has to be rebuilt for every single visitor, because the answer
 * differs per person -- and the header appears on every page, so that one
 * question was forcing the entire site to be rebuilt per request. Resolving it
 * here instead means the page itself is the same for everybody and can be
 * built once and shared, with the personal parts filled in afterwards.
 *
 * Nothing here is a security boundary. It decides what the header shows, not
 * what anyone is allowed to do -- every actual permission is still enforced by
 * the database's own rules, which do not trust the browser.
 */
export type Viewer =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; id: string; displayName: string; isAdmin: boolean };

export function useViewer(): Viewer {
  const [viewer, setViewer] = useState<Viewer>({ status: "loading" });

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    async function resolve(id: string | undefined, email: string | null | undefined) {
      if (!id) {
        if (active) setViewer({ status: "signed-out" });
        return;
      }

      // Shown straight away from what the session already carries, so the
      // header settles immediately instead of flickering through a blank
      // state while the display name is fetched.
      if (active) {
        setViewer({
          status: "signed-in",
          id,
          displayName: email ?? "",
          isAdmin: false,
        });
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;
      setViewer({
        status: "signed-in",
        id,
        displayName: data?.display_name ?? email ?? "",
        isAdmin: data?.role === "admin",
      });
    }

    // getSession reads the cookie already in the browser; getUser would be a
    // network round trip on every page view to learn what is sitting locally.
    supabase.auth
      .getSession()
      .then(({ data }) => resolve(data.session?.user?.id, data.session?.user?.email));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      resolve(session?.user?.id, session?.user?.email)
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return viewer;
}
