"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PRIMARY = "#137fec";

interface TasksDataPoint {
  name: string;
  pct: number;
  completed: number;
  total: number;
  fullLabel: string;
}

interface ValidationsDataPoint {
  name: string;
  count: number;
  fullLabel: string;
}

export function TasksChart({ data }: { data: TasksDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Create and use sprints to see completion over time.</p>
      </div>
    );
  }
  return (
    <>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value, _name, props) => {
                const p = props?.payload;
                const v = typeof value === "number" ? value : 0;
                return [`${v}%${p?.total != null ? ` (${p.completed ?? 0}/${p.total} tasks)` : ""}`, "Completion"];
              }}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
            />
            <Bar dataKey="pct" name="Completion" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2">% of tasks done per sprint (last 6 sprints)</p>
    </>
  );
}

export function ValidationsChart({ data }: { data: ValidationsDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Sprint data will appear here once you have sprints.</p>
      </div>
    );
  }
  return (
    <>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#d1d5db" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value) => [`${value ?? 0}`, "validations"]}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
            />
            <Bar dataKey="count" name="Validations" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2">Validation entries per sprint (last 6 sprints)</p>
    </>
  );
}
