"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export interface RevenueGroupLegendEntry {
  name: string;
  value: number;
  color: string;
}

interface RevenueGroupLegendTableProps {
  entries: RevenueGroupLegendEntry[];
  activeName: string | null;
  onSelect: (name: string | null) => void;
  total: number;
  formatValue: (value: number) => string;
  defaultOpen?: boolean;
}

/**
 * Einklappbare Rabattgruppen-Legende, ausgeklappt als kompakte Tabelle mit
 * Werten statt einer langen, unbegrenzten Textliste (Mobile-Fix PROJ-11).
 */
export function RevenueGroupLegendTable({
  entries,
  activeName,
  onSelect,
  total,
  formatValue,
  defaultOpen = false,
}: RevenueGroupLegendTableProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full min-h-[48px] items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted/50">
        <span>Rabattgruppen ({entries.length})</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Table>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.name}
                onClick={() => onSelect(activeName === entry.name ? null : entry.name)}
                className={`min-h-[48px] cursor-pointer ${activeName === entry.name ? "bg-muted" : ""}`}
              >
                <TableCell className="py-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right font-medium tabular-nums">
                  {formatValue(entry.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t font-medium hover:bg-transparent">
              <TableCell className="py-3">Gesamt</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{formatValue(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
