import dynamic from "next/dynamic";
import { Suspense } from "react";

// Use dynamic import with ssr: false to prevent any server-side execution of the Apps component
const AppsClient = dynamic(() => import("./AppsClient"), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">Loading App Store...</div>
});

export const dynamic = "force-dynamic";

export const metadata = {
  title: "App Store - ClearQ",
  description: "Browse and install apps and integrations",
};

export default function AppsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">Loading...</div>}>
      <AppsClient />
    </Suspense>
  );
}
