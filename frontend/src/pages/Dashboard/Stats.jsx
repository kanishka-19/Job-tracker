// src/pages/Dashboard/Stats.jsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStats } from "../../api/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

/* Small presentational cards */
function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white border rounded-md p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value ?? "—"}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

/* Growth card that displays percent and arrow */
function GrowthCard({ label, pct }) {
  const n = typeof pct === "number" && !Number.isNaN(pct) ? Math.round(pct) : null;
  const isPos = n !== null ? n > 0 : false;
  const isNeg = n !== null ? n < 0 : false;
  const cls = isPos ? "text-green-600" : isNeg ? "text-red-600" : "text-gray-700";
  const arrow = isPos ? "▲" : isNeg ? "▼" : "—";
  const display = n === null ? "—" : `${n > 0 ? `+${n}` : n}%`;

  return (
    <div className="bg-white border rounded-md p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold mt-2 ${cls}`}>
        {display} <span className="text-sm ml-2">{arrow}</span>
      </div>
    </div>
  );
}

export default function Stats() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 1000 * 60 * 2,
  });

  const defaultStats = data?.defaultStats || {
    pending: 0,
    interview: 0,
    rejected: 0,
    applied: 0,
  };

  const monthlyApplications = data?.monthlyApplications || [];

  // trend: be tolerant of different backend keys (momChange vs growthVsLastMonth, etc.)
  const trend = data?.trendStats || {};
  const totalApps = trend.totalApps ?? trend.totalApplications ?? 0;
  const avgPerMonth = trend.avgPerMonth ?? trend.averagePerMonth ?? 0;
  // mom/growth: backend sometimes returns `momChange` (number), or `growthVsLastMonth`
  const rawGrowth =
    typeof trend.momChange === "number"
      ? trend.momChange
      : typeof trend.growthVsLastMonth === "number"
      ? trend.growthVsLastMonth
      : null;
  const applicationsThisMonth =
    trend.applicationsThisMonth ?? trend.lastMonthCount ?? (monthlyApplications.length ? monthlyApplications[monthlyApplications.length - 1].count : 0);
  const activeMonths = trend.activeMonths ?? monthlyApplications.length;
  const peakMonth = trend.peakMonth ?? trend.peak?.date ?? "—";

  const chartData = useMemo(
    () => monthlyApplications.map((m) => ({ date: m.date, count: m.count })),
    [monthlyApplications]
  );

  const exportCSV = () => {
    const headers = ["Month", "Count"];
    const rows = monthlyApplications.map((m) => [m.date, m.count]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `applications_by_month_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <div className="mt-4 text-red-600">Failed to load stats</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Stats</h1>
          <p className="text-sm text-gray-500">Overview of your applications and trends</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:shadow-sm"
            title="Export CSV"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-white hover:shadow-sm"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status counts */}
      <section className="bg-white border rounded-md p-4 mb-6">
        <h3 className="text-sm font-semibold mb-4">Status counts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Pending" value={defaultStats.pending} />
          <StatCard title="Interview" value={defaultStats.interview} />
          <StatCard title="Rejected" value={defaultStats.rejected} />
          <StatCard title="Applied" value={defaultStats.applied} />
        </div>
      </section>

      {/* Insights row */}
      <section className="bg-white border rounded-md p-4 mb-6">
        <h3 className="text-sm font-semibold mb-4">Insights</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total applications" value={totalApps} />
          <StatCard title="Avg / month" value={avgPerMonth} />
          <StatCard title="This month" value={applicationsThisMonth} />
          <StatCard title="Peak month" value={peakMonth || "—"} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GrowthCard label="Growth vs last month" pct={rawGrowth} />
          <StatCard title="Active months (window)" value={activeMonths} />
        </div>
      </section>

      {/* Chart + list */}
      <section className="bg-white border rounded-md p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold">Applications (past months)</h3>
          <div className="text-xs text-gray-400">{monthlyApplications.length} month(s)</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div className="space-y-3">
              {monthlyApplications.map((m) => (
                <div key={m.date} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">{m.date}</div>
                  <div className="font-medium">{m.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
