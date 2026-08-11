import { cn } from "@/lib/utils";
import { TREND_EMOJI, type RiskLevel, type Trend } from "@/lib/stock-types";

export function TrendBadge({ trend, className }: { trend: Trend; className?: string }) {
  const styles: Record<Trend, string> = {
    UP: "bg-up/15 text-up border-up/30",
    DOWN: "bg-down/15 text-down border-down/30",
    NEUTRAL: "bg-neutral/15 text-neutral border-neutral/30",
  };
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tracking-wide",
        styles[trend],
        className,
      )}
    >
      {trend} {TREND_EMOJI[trend]}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Low: "bg-up/15 text-up border-up/30",
    Medium: "bg-neutral/15 text-neutral border-neutral/30",
    High: "bg-down/15 text-down border-down/30",
  };
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-sm font-medium", styles[risk])}>
      {risk} risk
    </span>
  );
}