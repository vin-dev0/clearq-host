export const dynamic = "force-dynamic";

/**
 * REBUILD_TRIGGER_V3: CLEAN_RUN_DEDUPLICATED
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <SettingsClient user={session.user} />;
}
