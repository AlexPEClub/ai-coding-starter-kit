export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPartnersWithRevenue } from "@/lib/actions/partners";
import { KundenSearch } from "./components/kunden-search";
import { TrendingUp, MapPin } from "lucide-react";

export const metadata = {
  title: "Kunden — TMS 2.0",
  description: "Kunden nach Umsatz (letzte 12 Monate)",
};

export default async function KundenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;

  const result = await getPartnersWithRevenue(search);

  if (!result.ok) {
    return (
      <div className="p-6">
        <p className="text-destructive">Fehler beim Laden der Kunden: {result.error}</p>
      </div>
    );
  }

  const partners = result.data;

  const formatCurrency = (value: number) => {
    if (value === 0) return "—";
    return `€${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatAddress = (addr: any) => {
    if (!addr) return null;
    const parts = [addr.street, addr.postal_code, addr.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunden</h1>
          <p className="text-muted-foreground text-sm">
            Sortiert nach Umsatz (letzte 12 Monate)
          </p>
        </div>
        <KundenSearch initial={search} />
      </div>

      {/* Mobile: Karten-Layout */}
      <div className="md:hidden space-y-3">
        {partners.map((partner) => {
          const address = formatAddress(partner.shipping_address);
          return (
            <Link
              key={partner.id}
              href={`/kunden/${partner.id}`}
              className="block rounded-lg border bg-card p-4 shadow-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {partner.company_name || partner.display_name}
                  </p>
                  {partner.easybill_customer_number && (
                    <p className="text-xs text-muted-foreground">
                      #{partner.easybill_customer_number}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${partner.revenue_365d > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {formatCurrency(partner.revenue_365d)}
                  </p>
                </div>
              </div>
              
              {address && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{address}</span>
                </p>
              )}
              
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                {partner.phone && <span>{partner.phone}</span>}
                {partner.email && <span className="truncate max-w-[150px]">{partner.email}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: Tabelle - ganze Zeile klickbar */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Kunde</th>
              <th className="px-4 py-3 text-left font-medium">Kunden-Nr.</th>
              <th className="px-4 py-3 text-left font-medium">Ansprechpartner</th>
              <th className="px-4 py-3 text-left font-medium">Lieferadresse</th>
              <th className="px-4 py-3 text-left font-medium">Kontakt</th>
              <th className="px-4 py-3 text-right font-medium">
                <div className="flex items-center justify-end gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Umsatz (12 Mon.)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partners.map((partner) => {
              const address = formatAddress(partner.shipping_address);
              return (
                <tr
                  key={partner.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/kunden/${partner.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {partner.company_name || partner.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {partner.easybill_customer_number ? `#${partner.easybill_customer_number}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {partner.first_name || partner.last_name
                      ? `${partner.first_name || ""} ${partner.last_name || ""}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                    {address ? (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {address}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {partner.email && (
                        <a
                          href={`mailto:${partner.email}`}
                          className="text-primary hover:underline block truncate max-w-[150px]"
                        >
                          {partner.email}
                        </a>
                      )}
                      {partner.phone && (
                        <a
                          href={`tel:${partner.phone}`}
                          className="text-primary hover:underline block"
                        >
                          {partner.phone}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span
                      className={
                        partner.revenue_365d > 0
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {formatCurrency(partner.revenue_365d)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {partners.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Keine Kunden gefunden.</p>
        </div>
      )}
    </div>
  );
}
