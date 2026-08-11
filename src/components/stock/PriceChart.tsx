import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PriceRow } from "@/lib/stock-types";
import { money, shortDate } from "@/lib/format";

export function PriceChart({ rows, height = 320 }: { rows: PriceRow[]; height?: number }) {
  const data = rows.map((r) => ({ date: r.price_date, close: r.close }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="closeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            minTickGap={40}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            tickLine={false}
            width={64}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => money(v)}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
            labelFormatter={(label: string) => shortDate(label)}
            formatter={(value: number) => [money(value), "Close"]}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#closeFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}