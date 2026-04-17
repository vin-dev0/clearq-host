export const dynamic = "force-dynamic";


import MobilePageClient from "./MobilePageClient";

// Force dynamic rendering to prevent static prerendering

export default function MobilePage() {
  return <MobilePageClient />;
}
