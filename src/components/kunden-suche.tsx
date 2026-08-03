"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchPartnersGlobal, type PartnerSearchResult } from "@/lib/actions/partners";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 150;

function formatRevenue(value: number | null): string | null {
  if (value === null) return null;
  if (value === 0) return "—";
  return `€${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function KundenSuche() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PartnerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errored, setErrored] = useState(false);

  // Debounced Suche mit Race-Schutz: nur die Antwort der zuletzt gestarteten
  // Anfrage darf das Ergebnis setzen (siehe PROJ-43-Spec, Edge Cases). Der
  // Reset bei zu kurzer Eingabe passiert synchron im onChange-Handler unten,
  // nicht hier — sonst setzt der Effekt direkt beim Rendern erneut State.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const seq = ++requestSeq.current;
      setLoading(true);
      searchPartnersGlobal(trimmed).then((result) => {
        if (seq !== requestSeq.current) return; // veraltete Antwort verwerfen
        setLoading(false);
        setSearched(true);
        setErrored(!result.ok);
        setResults(result.ok ? result.data : []);
      });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(partnerId: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSearched(false);
    router.push(`/kunden/${partnerId}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
    }
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            setOpen(true);
            if (value.trim().length < MIN_QUERY_LENGTH) {
              requestSeq.current += 1;
              setResults([]);
              setLoading(false);
              setSearched(false);
              setErrored(false);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Kunde suchen…"
          aria-label="Kunden durchsuchen"
          className="h-11 rounded-xl pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card shadow-md">
          {searched && !loading && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {errored ? "Suche fehlgeschlagen" : "Keine Kunden gefunden"}
            </p>
          )}
          {results.map((partner) => {
            const revenue = formatRevenue(partner.revenue365d);
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => handleSelect(partner.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {partner.companyName || partner.displayName}
                  </p>
                  {partner.city && (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {partner.city}
                    </p>
                  )}
                </div>
                {revenue && (
                  <span className="shrink-0 text-sm font-semibold text-emerald-600">
                    {revenue}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
