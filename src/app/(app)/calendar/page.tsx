export const dynamic = "force-dynamic";

import CalendarClient from "./CalendarClient";
import { getCalendarEvents } from "@/lib/actions/calendar";

export const dynamic = "force-dynamic";


export const metadata = {
  title: "Calendar | ClearQ",
  description: "Interactive team calendar with month, week, and day views.",
};

export default async function CalendarPage() {
  const initialEvents = await getCalendarEvents();
  return <CalendarClient initialEvents={initialEvents} />;
}
