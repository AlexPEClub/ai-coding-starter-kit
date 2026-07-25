"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const HANDEL_COLOR = "#10b981";
const SERVICE_COLOR = "#f59e0b";

export interface RevenueGroupRadarPoint {
  subject: string;
  Handel: number;
  Service: number;
}

interface RevenueGroupRadarChartProps {
  data: RevenueGroupRadarPoint[];
  formatValue: (value: number) => string;
}

/**
 * Radar-Chart "Rabattgruppen-Vergleich": eine Achse pro Rabattgruppe, zwei
 * Serien Handel/Service — zeigt, in welchen Gruppen welche Kategorie
 * überwiegt. Periodenvergleich ist bereits über die KPI-Badges abgedeckt,
 * hier geht es um den Kategorie-Vergleich je Gruppe.
 */
export function RevenueGroupRadarChart({ data, formatValue }: RevenueGroupRadarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Keine Rabattgruppen-Daten im gewählten Zeitraum verfügbar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(value: any) => (value ? `€${(Number(value) / 1000).toFixed(0)}k` : "€0")}
        />
        <Radar name="Handel" dataKey="Handel" stroke={HANDEL_COLOR} fill={HANDEL_COLOR} fillOpacity={0.25} />
        <Radar name="Service" dataKey="Service" stroke={SERVICE_COLOR} fill={SERVICE_COLOR} fillOpacity={0.25} />
        <Tooltip formatter={(value: any, name: any) => [formatValue(Number(value)), String(name)]} />
        <Legend wrapperStyle={{ paddingTop: "0.5rem" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
