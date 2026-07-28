import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getDriverToursForToday, getDriverToursForDateRange } from "@/lib/actions/driver-tours";
import { DriverTourList } from "@/components/driver/driver-tour-list";
import { DriverCalendarView } from "@/components/driver/driver-calendar-view";
import { EmptyState } from "@/components/driver/empty-state";
import { DriverMap } from "@/components/driver/driver-map";
import { PrintQrCodesButton } from "@/components/werkzeug-auftrag/print-qr-codes-button";

export const metadata: Metadata = {
  title: "Fahrer — TMS 2.0",
};

export default async function DriverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  // PROJ-34: Fahrer-Auftragserfassung ist Fahrer/Admin vorbehalten.
  if (!profile.roles?.some((r) => r === "fahrer" || r === "admin")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tab = (params.tab as string) || "today";

  // Heute
  const todayResult = await getDriverToursForToday();
  
  // Nächste 5 Arbeitstage
  const next5DaysResult = tab === "upcoming" 
    ? await getDriverToursForDateRange(5)
    : null;

  const todayTours = todayResult.ok ? todayResult.data : [];
  const upcomingTours = next5DaysResult?.ok ? next5DaysResult.data : [];

  const todayFormatted = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            🚚 Meine Abholungen
          </h1>
          <p className="text-muted-foreground">
            {todayFormatted}
          </p>
        </div>
        <PrintQrCodesButton />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        <a
          href="/fahrer?tab=today"
          className={`px-4 py-2 text-sm font-medium ${
            tab === "today" || !tab
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Heute ({todayTours.length})
        </a>
        <a
          href="/fahrer?tab=upcoming"
          className={`px-4 py-2 text-sm font-medium ${
            tab === "upcoming"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Nächste 5 Tage
        </a>
      </div>

      {/* Inhalt */}
      {tab === "upcoming" ? (
        upcomingTours.length > 0 ? (
          <DriverCalendarView tours={upcomingTours} />
        ) : (
          <EmptyState message="Keine Abholungen in den nächsten 5 Tagen geplant." />
        )
      ) : (
        <div className="space-y-6">
          {todayTours.length > 0 ? (
            <>
              <DriverTourList tours={todayTours} />
              <DriverMap tours={todayTours} />
            </>
          ) : (
            <EmptyState message="Heute keine Abholungen geplant." />
          )}
        </div>
      )}
    </div>
  );
}
