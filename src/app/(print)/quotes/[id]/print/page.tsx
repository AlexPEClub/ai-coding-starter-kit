"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useConfig, useQuotes } from "@/lib/storage";
import { formatEUR, formatNumber } from "@/lib/pricing";
import { PROCESS_LABELS } from "@/lib/types";

export default function QuotePrintPage() {
  const params = useParams<{ id: string }>();
  const quotes = useQuotes();
  const config = useConfig();
  const quote = quotes.find((q) => q.id === params.id);

  useEffect(() => {
    if (!quote) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [quote]);

  if (!quote) {
    return <div className="p-10 text-sm">Angebot nicht gefunden.</div>;
  }

  const total = quote.variants.reduce((s, v) => s + v.breakdown.totalPrice, 0);
  const company = config.company;

  return (
    <div className="bg-white text-black mx-auto max-w-3xl p-10 text-[12px] leading-relaxed print:p-0">
      <header className="flex justify-between items-start border-b pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">{company.name || "Mechatronic Factory"}</h1>
          {company.address && (
            <p className="whitespace-pre-line text-[11px] text-gray-700">{company.address}</p>
          )}
          <p className="text-[11px] text-gray-700 mt-1">
            {company.email}
            {company.email && company.phone ? " · " : ""}
            {company.phone}
          </p>
          {company.vatId && (
            <p className="text-[11px] text-gray-700">USt-IdNr.: {company.vatId}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Angebot</p>
          <p className="text-2xl font-bold">{quote.number}</p>
          <p className="text-[11px] text-gray-700 mt-1">
            Datum: {new Date(quote.createdAt).toLocaleDateString("de-DE")}
          </p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Kunde</p>
          <p className="font-medium">{quote.customer.name}</p>
          {quote.customer.company && <p>{quote.customer.company}</p>}
          {quote.customer.address && (
            <p className="whitespace-pre-line">{quote.customer.address}</p>
          )}
          {quote.customer.email && <p>{quote.customer.email}</p>}
          {quote.customer.phone && <p>{quote.customer.phone}</p>}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Bauteil</p>
          <p className="font-medium">{quote.partLabel}</p>
          <p className="text-gray-700">
            {formatNumber(quote.part.volumeCm3)} cm3 ·{" "}
            {formatNumber(quote.part.boundingBox.x, 1)} x{" "}
            {formatNumber(quote.part.boundingBox.y, 1)} x{" "}
            {formatNumber(quote.part.boundingBox.z, 1)} mm
          </p>
          {quote.partNotes && (
            <p className="text-gray-700 mt-1 whitespace-pre-line">{quote.partNotes}</p>
          )}
        </div>
      </section>

      <section className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black/30 text-left">
              <th className="py-2 pr-2">Pos.</th>
              <th className="py-2 pr-2">Beschreibung</th>
              <th className="py-2 pr-2 text-right">Menge</th>
              <th className="py-2 pr-2 text-right">Stueckpreis</th>
              <th className="py-2 text-right">Summe</th>
            </tr>
          </thead>
          <tbody>
            {quote.variants.map((v, idx) => (
              <tr key={idx} className="border-b border-black/10 align-top">
                <td className="py-2 pr-2">{idx + 1}</td>
                <td className="py-2 pr-2">
                  <div className="font-medium">
                    {PROCESS_LABELS[v.process]} - {v.breakdown.materialName}
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Druckzeit ~ {formatNumber(v.breakdown.estimatedPrintHours)} h
                    {v.breakdown.appliedDiscountPercent > 0 &&
                      ` · Mengenrabatt -${v.breakdown.appliedDiscountPercent}%`}
                  </div>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">{v.quantity}</td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {formatEUR(v.breakdown.unitPrice)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatEUR(v.breakdown.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td colSpan={4} className="py-3 text-right font-medium">
                Gesamtsumme (netto)
              </td>
              <td className="py-3 text-right text-base font-bold tabular-nums">
                {formatEUR(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="text-[11px] text-gray-700 space-y-1">
        <p>Alle Preise verstehen sich als Nettopreise zzgl. der gesetzlichen MwSt.</p>
        <p>Angebot gueltig fuer 30 Tage ab Erstellungsdatum.</p>
        <p>Lieferzeit auf Anfrage.</p>
      </section>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
