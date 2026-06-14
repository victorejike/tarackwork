import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { OutreachItem, OutreachStatus } from "../types";

// Palette matching a refined Ejicode brand: clean blues, greens, slate, and gold
const STATUS_COLORS: Record<OutreachStatus, string> = {
  [OutreachStatus.INITIAL_OUTREACH]: "#0284c7", // Sky blue
  [OutreachStatus.IN_DISCUSSION]: "#f59e0b", // Amber
  [OutreachStatus.PROPOSAL_SENT]: "#8b5cf6", // Purple/Indigo
  [OutreachStatus.NDA_SIGNED]: "#14b8a6", // Teal/Cyan
  [OutreachStatus.WON]: "#10b981", // Emerald Green
  [OutreachStatus.LOST]: "#ef4444", // Red/Crimson
};

interface OutreachChartsProps {
  items: OutreachItem[];
}

export const OutreachCharts: React.FC<OutreachChartsProps> = ({ items }) => {
  // 1. Calculate status distribution
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      [OutreachStatus.INITIAL_OUTREACH]: 0,
      [OutreachStatus.IN_DISCUSSION]: 0,
      [OutreachStatus.PROPOSAL_SENT]: 0,
      [OutreachStatus.NDA_SIGNED]: 0,
      [OutreachStatus.WON]: 0,
      [OutreachStatus.LOST]: 0,
    };

    items.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [items]);

  // 2. Outreach Trends Over Time (Grouped by Month/Year)
  const monthlyTimelineData = useMemo(() => {
    const months: Record<string, { monthKey: string; total: number; won: number; discussion: number; conversionRate: number }> = {};

    items.forEach((item) => {
      const dateStr = item.lastContactDate || item.followUpDate || "";
      if (!dateStr) return;

      // Extract Year-Month, e.g. "2026-06"
      const parts = dateStr.split("-");
      if (parts.length < 2) return;
      const key = `${parts[0]}-${parts[1]}`;

      if (!months[key]) {
        // Human-friendly header formatting, e.g. "Jun 2026"
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 15);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        months[key] = { monthKey: label, total: 0, won: 0, discussion: 0, conversionRate: 0 };
      }

      months[key].total++;
      if (item.status === OutreachStatus.WON || item.status === OutreachStatus.NDA_SIGNED) {
        months[key].won++;
      }
      if (item.status === OutreachStatus.IN_DISCUSSION || item.status === OutreachStatus.PROPOSAL_SENT) {
        months[key].discussion++;
      }
    });

    // Sort key-wise
    const sortedKeys = Object.keys(months).sort();
    return sortedKeys.map((key) => {
      const m = months[key];
      m.conversionRate = m.total > 0 ? Math.round((m.won / m.total) * 100) : 0;
      return m;
    });
  }, [items]);

  // Primary Metrics
  const stats = useMemo(() => {
    const total = items.length;
    const wonCount = items.filter((i) => i.status === OutreachStatus.WON).length;
    const lostCount = items.filter((i) => i.status === OutreachStatus.LOST).length;
    const closedCount = wonCount + lostCount;
    const outreachConverted = total > 0 ? Math.round((wonCount / total) * 100) : 0;
    const activeDiscussion = items.filter(
      (i) => i.status !== OutreachStatus.WON && i.status !== OutreachStatus.LOST
    ).length;

    return { total, wonCount, activeDiscussion, outreachConverted };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="bg-[#161B22] border border-white/5 rounded-2xl p-12 text-center shadow-lg">
        <p className="text-slate-400 font-medium">No outreach history to visualize yet. Add records to compile conversion metrics!</p>
      </div>
    );
  }

  return (
    <div id="outreach-dashboard-charts" className="space-y-8">
      {/* Visual KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total Outreaches</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-[#E2E8F0] tracking-tight">{stats.total}</span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Active Pitching
            </span>
          </div>
        </div>

        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Partnerships Won 🏆</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-emerald-400 tracking-tight">{stats.wonCount}</span>
            <span className="text-xs text-slate-500">closed deals</span>
          </div>
        </div>

        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Success Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-indigo-400 tracking-tight">{stats.outreachConverted}%</span>
            <span className="text-xs text-slate-500">Won vs total</span>
          </div>
        </div>

        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Ongoing Discussions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-light text-indigo-400 tracking-tight">{stats.activeDiscussion}</span>
            <span className="text-xs text-slate-500">in process</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timeline Line Chart: Success Rate & Outreach Volume Over Time */}
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-3">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#E2E8F0]">Outreach Trends & Conversion Rate</h3>
            <p className="text-xs text-slate-500">Monthly outreach volumes and success outcomes over time</p>
          </div>
          {monthlyTimelineData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-xs">
              Waiting for date-associated outreach activity...
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTimelineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="monthKey" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0D1117", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0" }}
                    itemStyle={{ fontSize: "12px", color: "#E2E8F0" }}
                    labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total"
                    name="Outreach Attempted"
                    stroke="#0284c7"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversionRate"
                    name="Success Rate (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#E2E8F0]">Outreach Funnel Split</h3>
            <p className="text-xs text-slate-500">Current share of lead stages in the tracker</p>
          </div>
          <div className="h-[280px] flex flex-col justify-between">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as OutreachStatus] || "#cbd5e1"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0D1117", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0" }}
                    itemStyle={{ fontSize: "12px", color: "#E2E8F0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend grids */}
            <div className="grid grid-cols-2 gap-2 text-[10px] max-h-[70px] overflow-y-auto pr-1">
              {statusDistributionData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[entry.name as OutreachStatus] }}
                  />
                  <span className="text-slate-350 font-medium truncate">{entry.name}</span>
                  <span className="text-slate-500">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
