"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const KBAdminClientDynamic = dynamic(() => import("./KBAdminClient").then(mod => mod.KBAdminClient), {
  ssr: false,
  loading: () => <div className="p-8 text-zinc-500">Loading Knowledge Base...</div>
});

export function KBAdminWrapper({ initialArticles, categories }: { initialArticles: any[], categories: any[] }) {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <KBAdminClientDynamic initialArticles={initialArticles} categories={categories} />
    </Suspense>
  );
}
