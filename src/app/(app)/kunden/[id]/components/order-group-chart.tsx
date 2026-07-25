"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { CHART_GROUP_COLORS as CHART_COLORS, type OrderGroupStat } from "@/lib/actions/orders-helpers";

/* ═══════════════════════════════════════════
   Donut-Chart: Bestellpositionen je Artikelgruppe
   Klick auf ein Segment filtert die Bestellhistorie
   ═══════════════════════════════════════════ */

interface OrderGroupChartProps {
  stats: OrderGroupStat[];
  activeGroupId: number | null;
  onSelectGroup: (groupId: number | null) => void;
  isLoading?: boolean;
}

export function OrderGroupChart({
  stats,
  activeGroupId,
  onSelectGroup,
  isLoading,
}: OrderGroupChartProps) {
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  const handleSegmentClick = (groupId: number) => {
    onSelectGroup(activeGroupId === groupId ? null : groupId);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Artikelgruppen</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Lade Artikelgruppen...
          </div>
        ) : stats.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Keine gruppierten Artikel gefunden
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-48 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="count"
                    nameKey="group_name"
                    label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")}
                    labelLine={false}
                    onClick={(entry: any) => handleSegmentClick(entry.group_id)}
                    className="cursor-pointer"
                  >
                    {stats.map((entry, index) => (
                      <Cell
                        key={entry.group_id}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        opacity={activeGroupId === null || activeGroupId === entry.group_id ? 1 : 0.35}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const num = Number(value);
                      return [`${num} (${((num / total) * 100).toFixed(1)}%)`, name];
                    }}
                    contentStyle={{ fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 text-sm w-full">
              {stats.map((entry, index) => (
                <button
                  key={entry.group_id}
                  type="button"
                  onClick={() => handleSegmentClick(entry.group_id)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/50 ${
                    activeGroupId === entry.group_id ? "bg-muted" : ""
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">{entry.group_name}</span>
                  <span className="font-medium ml-auto">{entry.count}</span>
                </button>
              ))}
              <div className="border-t pt-1 mt-1 text-muted-foreground text-xs">
                Gesamt: {total}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
