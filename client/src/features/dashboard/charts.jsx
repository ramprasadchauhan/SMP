/* eslint-disable react/prop-types */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { capitalize } from "../../utils/format";

const tooltipStyle = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    boxShadow: "var(--shadow-md)",
    fontSize: 12,
    color: "var(--text)",
  },
  labelStyle: { color: "var(--text-muted)", marginBottom: 4 },
  itemStyle: { padding: 0 },
};
const axis = { stroke: "var(--text-subtle)", fontSize: 12, tickLine: false, axisLine: false };

// Charts are wrapped in a <figure> with a text summary for screen readers.
export function Figure({ label, summary, height = 280, children }) {
  return (
    <figure aria-label={label} className="m-0">
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

export function TrendChart({ data, series, days }) {
  const fmt = days > 90 ? "MMM" : "MMM D";
  const totals = series.map((s) => `${s.label}: ${data.reduce((n, d) => n + (d[s.key] || 0), 0)}`).join(", ");
  // Daily counts are discrete, so stacked bars represent them honestly.
  return (
    <Figure label="Activity trend" summary={`Daily totals over the last ${days} days. ${totals}.`}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap={days > 90 ? 0 : "20%"}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="date" {...axis} tickFormatter={(d) => dayjs(d).format(fmt)} minTickGap={24} />
        <YAxis {...axis} allowDecimals={false} width={44} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--surface-hover)" }} labelFormatter={(d) => dayjs(d).format("ddd, MMM D YYYY")} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="trend"
            fill={s.color}
            radius={i === series.length - 1 ? [3, 3, 0, 0] : 0}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </Figure>
  );
}

const STATUS_COLORS = { approved: "var(--chart-1)", pending: "var(--chart-3)", rejected: "var(--text-subtle)", blocked: "var(--chart-4)" };

export function StatusDonut({ byStatus }) {
  const data = Object.entries(byStatus).map(([status, value]) => ({ name: capitalize(status), status, value }));
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full max-w-[180px]">
        <Figure label="Products by status" summary={data.map((d) => `${d.name}: ${d.value}`).join(", ")} height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </Figure>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-fg">{total}</span>
          <span className="text-xs text-muted">listings</span>
        </div>
      </div>
      <ul className="m-0 flex w-full list-none flex-col gap-2 p-0">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[d.status] }} aria-hidden="true" />
              {d.name}
            </span>
            <span className="font-semibold tabular-nums text-fg">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryBars({ data }) {
  const rows = data.map((d) => ({ ...d, label: capitalize(d.category) }));
  return (
    <Figure label="Listings by category" summary={rows.map((r) => `${r.label}: ${r.count}`).join(", ")} height={Math.max(160, rows.length * 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axis} width={88} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--surface-hover)" }} />
        <Bar dataKey="count" name="Listings" fill="var(--chart-2)" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} />
      </BarChart>
    </Figure>
  );
}
