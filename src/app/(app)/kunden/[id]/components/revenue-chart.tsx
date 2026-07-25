"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wrench, Package, HelpCircle, ArrowUpRight, ArrowDownRight, Radar as RadarIcon } from "lucide-react";
import {
  getPartnerRevenueSummary,
  getPartnerRevenueChartData,
  getPartnerRevenueGroupChartData,
  getAvailableRevenueYears,
  RevenuePeriod,
  RevenueCategoryTotals,
  RevenueChartPoint,
  RevenueGroupChartResult,
} from "@/lib/actions/revenue";
import { RevenueGroupDonutChart } from "./revenue-group-donut-chart";
import { RevenueGroupRadarChart, type RevenueGroupRadarPoint } from "./revenue-group-radar-chart";

interface RevenueChartProps {
  partnerId: string;
}

type Category = "handel" | "service";

const HANDEL_COLOR = "#10b981";
const SERVICE_COLOR = "#f59e0b";
const UNASSIGNED_COLOR = "#9ca3af";

/** Summiert die monatsweisen Rabattgruppen-Punkte zu Gesamtwerten je Gruppe. */
function aggregateGroupTotals(result: RevenueGroupChartResult | null): { name: string; value: number }[] {
  if (!result) return [];
  return result.groupNames
    .map((name) => ({
      name,
      value: result.points.reduce((sum, p) => sum + (p.values[name] || 0), 0),
    }))
    .filter((g) => g.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Baut die Radar-Datenpunkte (eine Achse je Rabattgruppe, Serien Handel/Service). */
function buildRadarData(
  handel: RevenueGroupChartResult | null,
  service: RevenueGroupChartResult | null
): RevenueGroupRadarPoint[] {
  const handelTotals = aggregateGroupTotals(handel);
  const serviceTotals = aggregateGroupTotals(service);
  const allNames = [...new Set([...handelTotals.map((g) => g.name), ...serviceTotals.map((g) => g.name)])].sort();

  return allNames.map((name) => ({
    subject: name,
    Handel: handelTotals.find((g) => g.name === name)?.value ?? 0,
    Service: serviceTotals.find((g) => g.name === name)?.value ?? 0,
  }));
}

function formatMoney(value: number): string {
  return `€${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function periodKey(period: RevenuePeriod): string {
  return period.type === "year" ? `year-${period.year}` : period.type;
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous) return null;
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}
      {change.toFixed(0)}%
    </span>
  );
}

interface KpiCardProps {
  title: string;
  shortTitle?: string;
  value: number;
  previous?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  borderColor: string;
  active?: boolean;
  onClick?: () => void;
  index: number;
  testId?: string;
}

function KpiCard({
  title,
  shortTitle,
  value,
  previous,
  icon: Icon,
  color,
  bg,
  borderColor,
  active,
  onClick,
  index,
  testId,
}: KpiCardProps) {
  return (
    <motion.div
      data-testid={testId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={`rounded-lg border ${active ? "border-primary ring-1 ring-primary" : borderColor} bg-card p-3 sm:p-4 shadow-sm ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-md p-2 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
            <span className="sm:hidden">{shortTitle ?? title}</span>
            <span className="hidden sm:inline">{title}</span>
          </p>
          <p className="text-lg font-semibold truncate">{formatMoney(value)}</p>
          {previous !== undefined && (
            <div className="mt-1">
              <ChangeIndicator current={value} previous={previous} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function RevenueChart({ partnerId }: RevenueChartProps) {
  const [period, setPeriod] = useState<RevenuePeriod>({ type: "rolling365" });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const [totals, setTotals] = useState<RevenueCategoryTotals | null>(null);
  const [previousTotals, setPreviousTotals] = useState<RevenueCategoryTotals | null>(null);
  const [chartPoints, setChartPoints] = useState<RevenueChartPoint[]>([]);
  const [groupChart, setGroupChart] = useState<RevenueGroupChartResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [radarOpen, setRadarOpen] = useState(false);
  const [radarHandel, setRadarHandel] = useState<RevenueGroupChartResult | null>(null);
  const [radarService, setRadarService] = useState<RevenueGroupChartResult | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);

  useEffect(() => {
    getAvailableRevenueYears(partnerId).then((result) => {
      if (result.ok) setAvailableYears(result.years);
    });
  }, [partnerId]);

  useEffect(() => {
    setActiveCategory(null);
    setRadarOpen(false);
  }, [partnerId, periodKey(period)]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const [summaryResult, chartResult] = await Promise.all([
        getPartnerRevenueSummary(partnerId, period),
        getPartnerRevenueChartData(partnerId, period),
      ]);
      if (cancelled) return;
      if (summaryResult.ok) {
        setTotals(summaryResult.current);
        setPreviousTotals(summaryResult.previous);
      }
      if (chartResult.ok) setChartPoints(chartResult.points);
      setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, periodKey(period)]);

  useEffect(() => {
    if (!activeCategory) {
      setGroupChart(null);
      return;
    }
    let cancelled = false;
    getPartnerRevenueGroupChartData(partnerId, period, activeCategory).then((result) => {
      if (!cancelled && result.ok) setGroupChart(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, periodKey(period), activeCategory]);

  useEffect(() => {
    if (!radarOpen) return;
    let cancelled = false;
    setRadarLoading(true);
    Promise.all([
      getPartnerRevenueGroupChartData(partnerId, period, "handel"),
      getPartnerRevenueGroupChartData(partnerId, period, "service"),
    ]).then(([handelResult, serviceResult]) => {
      if (cancelled) return;
      setRadarHandel(handelResult.ok ? handelResult : null);
      setRadarService(serviceResult.ok ? serviceResult : null);
      setRadarLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, periodKey(period), radarOpen]);

  const periodOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: "rolling365", label: "Letzte 12 Monate" },
    ];
    for (const year of availableYears) {
      options.push({ value: `year-${year}`, label: year.toString() });
    }
    options.push({ value: "all", label: "Gesamt" });
    return options;
  }, [availableYears]);

  function handlePeriodChange(value: string) {
    if (value === "all") setPeriod({ type: "all" });
    else if (value === "rolling365") setPeriod({ type: "rolling365" });
    else setPeriod({ type: "year", year: Number(value.replace("year-", "")) });
  }

  function toggleCategory(category: Category) {
    setActiveCategory((current) => (current === category ? null : category));
  }

  const standardChartData = useMemo(
    () =>
      chartPoints.map((p) => ({
        name: p.label,
        Handelsware: Number(p.handel.toFixed(2)),
        Service: Number(p.service.toFixed(2)),
        "Nicht zugeordnet": Number(p.unassigned.toFixed(2)),
      })),
    [chartPoints]
  );

  const donutGroups = useMemo(() => aggregateGroupTotals(groupChart), [groupChart]);

  const radarData = useMemo(
    () => buildRadarData(radarHandel, radarService),
    [radarHandel, radarService]
  );

  const hasChartData = standardChartData.some(
    (d) => d.Handelsware > 0 || d.Service > 0 || d["Nicht zugeordnet"] > 0
  );

  if (isLoading && !totals) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="h-[100px] animate-pulse bg-muted rounded">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted-foreground/10 rounded" />
            ))}
          </div>
        </div>
        <div className="h-[400px] animate-pulse bg-muted rounded" />
      </motion.div>
    );
  }

  const current = totals ?? { total: 0, handel: 0, service: 0, unassigned: 0 };
  const previous = previousTotals;
  const showUnassigned = current.unassigned > 0;

  return (
    <div className="space-y-6">
      {/* KPI-Reihe */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard
          title="Gesamtumsatz"
          shortTitle="Gesamt"
          testId="kpi-total"
          value={current.total}
          previous={previous?.total}
          icon={TrendingUp}
          color="text-blue-600"
          bg="bg-blue-50"
          borderColor="border-blue-100"
          onClick={() => {
            setActiveCategory(null);
            setRadarOpen(false);
          }}
          index={0}
        />
        <KpiCard
          title="Handelsumsatz"
          shortTitle="Handel"
          testId="kpi-handel"
          value={current.handel}
          previous={previous?.handel}
          icon={Package}
          color="text-emerald-600"
          bg="bg-emerald-50"
          borderColor="border-emerald-100"
          active={activeCategory === "handel"}
          onClick={() => {
            setRadarOpen(false);
            toggleCategory("handel");
          }}
          index={1}
        />
        <KpiCard
          title="Serviceumsatz"
          shortTitle="Service"
          testId="kpi-service"
          value={current.service}
          previous={previous?.service}
          icon={Wrench}
          color="text-amber-600"
          bg="bg-amber-50"
          borderColor="border-amber-100"
          active={activeCategory === "service"}
          onClick={() => {
            setRadarOpen(false);
            toggleCategory("service");
          }}
          index={2}
        />
        {showUnassigned && (
          <KpiCard
            title="Nicht zugeordnet"
            shortTitle="Unzugeordnet"
            testId="kpi-unassigned"
            value={current.unassigned}
            icon={HelpCircle}
            color="text-slate-600"
            bg="bg-slate-50"
            borderColor="border-slate-100"
            index={3}
          />
        )}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border bg-card p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">
              {radarOpen && "Rabattgruppen-Vergleich"}
              {!radarOpen && activeCategory === "handel" && "Handelsumsatz nach Rabattgruppe"}
              {!radarOpen && activeCategory === "service" && "Serviceumsatz nach Rabattgruppe"}
              {!radarOpen && !activeCategory && "Umsatzentwicklung"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={radarOpen ? "secondary" : "outline"}
              size="sm"
              className="min-h-[48px] sm:min-h-9"
              onClick={() => {
                setRadarOpen((current) => !current);
                setActiveCategory(null);
              }}
            >
              <RadarIcon className="h-4 w-4 mr-1.5" />
              {radarOpen ? "Zurück" : "Rabattgruppen vergleichen"}
            </Button>
            <Select value={periodKey(period)} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {radarOpen ? (
          radarLoading ? (
            <div className="h-[360px] animate-pulse bg-muted rounded" />
          ) : (
            <RevenueGroupRadarChart data={radarData} formatValue={formatMoney} />
          )
        ) : !activeCategory ? (
          hasChartData ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={standardChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value: any) => (value ? `€${(Number(value) / 1000).toFixed(0)}k` : "€0")}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `€${Number(value).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`,
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "1rem" }} />
                <Bar dataKey="Handelsware" stackId="1" fill={HANDEL_COLOR} />
                <Bar dataKey="Service" stackId="1" fill={SERVICE_COLOR} />
                <Bar dataKey="Nicht zugeordnet" stackId="1" fill={UNASSIGNED_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Keine Umsatzdaten im gewählten Zeitraum verfügbar
            </div>
          )
        ) : (
          <RevenueGroupDonutChart groups={donutGroups} formatValue={formatMoney} />
        )}
      </motion.div>
    </div>
  );
}
