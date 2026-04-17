"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const AppsClient = dynamic(() => import("./AppsClient"), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">Loading App Store...</div>
});

export default function AppsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">Loading...</div>}>
      <AppsClient />
    </Suspense>
  );
}
