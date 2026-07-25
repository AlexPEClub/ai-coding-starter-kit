"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_GROUP_COLORS } from "@/lib/actions/orders-helpers";
import { RevenueGroupLegendTable } from "./revenue-group-legend-table";

interface RevenueGroupDonutChartProps {
  groups: { name: string; value: number }[];
  formatValue: (value: number) => string;
}

/**
 * Donut-Chart für die Rabattgruppen-Aufschlüsselung im Umsatz-Tab, im Stil
 * des bestehenden Donut-Charts der Bestellhistorie (order-group-chart.tsx).
 */
export function RevenueGroupDonutChart({ groups, formatValue }: RevenueGroupDonutChartProps) {
  const [active, setActive] = useState<string | null>(null);

  if (groups.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Keine Rabattgruppen-Daten im gewählten Zeitraum verfügbar
      </div>
    );
  }

  const total = groups.reduce((sum, g) => sum + g.value, 0);
  const entries = groups.map((g, i) => ({
    ...g,
    color: CHART_GROUP_COLORS[i % CHART_GROUP_COLORS.length],
  }));

  function handleSegmentClick(name: string) {
    setActive((current) => (current === name ? null : name));
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-full sm:w-48 h-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              dataKey="value"
              nameKey="name"
              onClick={(entry: any) => handleSegmentClick(entry.name)}
              className="cursor-pointer"
            >
              {entries.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={active === null || active === entry.name ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: any) => [formatValue(Number(value)), String(name)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full">
        <RevenueGroupLegendTable
          entries={entries}
          activeName={active}
          onSelect={setActive}
          total={total}
          formatValue={formatValue}
        />
      </div>
    </div>
  );
}
