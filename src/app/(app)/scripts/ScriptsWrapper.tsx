"use client";

import dynamic from "next/dynamic";

const ScriptsClient = dynamic(() => import("./ScriptsClient"), {
  ssr: false,
  loading: () => <div className="p-8 text-zinc-500">Loading Automation Hub...</div>
});

export function ScriptsWrapper() {
  return <ScriptsClient />;
}
