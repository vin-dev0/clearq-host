import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminArticles, getAdminCategories } from "@/lib/actions/kb";
import { KBAdminWrapper } from "./KBAdminWrapper";

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

  return <KBAdminWrapper initialArticles={articles} categories={categories} />;
}
