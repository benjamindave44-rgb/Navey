"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-heading text-5xl font-extrabold tracking-tight">
        NAVEY
      </h1>
      <p className="max-w-md text-lg font-medium">
        Navigate Good Spots Nearby. This is Phase 1: the project scaffold is
        running.
      </p>
      <div className="rounded-full bg-navey-ink px-5 py-2 text-sm font-bold text-navey-yellow">
        {status === "checking" && "Checking Supabase connection..."}
        {status === "connected" && "Connected to Supabase ✓"}
        {status === "error" && "Could not reach Supabase"}
      </div>
    </main>
  );
}
