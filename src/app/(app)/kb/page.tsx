import dynamic from "next/dynamic";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminArticles, getAdminCategories } from "@/lib/actions/kb";

const KBAdminClient = dynamic(() => import("./KBAdminClient").then(mod => mod.KBAdminClient), {
  ssr: false,
  loading: () => <div className="p-8 text-zinc-500">Loading Knowledge Base...</div>
});

export const dynamic = "force-dynamic";

export default async function KBPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [articles, categories] = await Promise.all([
    getAdminArticles(),
    getAdminCategories()
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <KBAdminClient initialArticles={articles} categories={categories} />
    </Suspense>
  );
}
