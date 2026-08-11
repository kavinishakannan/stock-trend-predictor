import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStocks } from "@/lib/stock-queries";

export function StockSearch({
  ticker,
  onSelect,
  busy,
}: {
  ticker: string;
  onSelect: (ticker: string) => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState(ticker);
  const { data: stocks } = useStocks();

  return (
    <div className="panel p-5">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const next = value.trim().toUpperCase();
          if (next) onSelect(next);
        }}
      >
        <div className="flex-1">
          <label htmlFor="ticker" className="text-xs tracking-wide text-muted-foreground uppercase">
            Enter stock symbol
          </label>
          <Input
            id="ticker"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="AAPL"
            maxLength={12}
            className="num mt-1.5"
          />
        </div>
        <Button type="submit" className="sm:mt-6" disabled={busy}>
          <Search className="size-4" /> Analyze Stock
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {(stocks ?? []).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setValue(s.ticker);
              onSelect(s.ticker);
            }}
            className={`num rounded-full border px-3 py-1 text-xs transition-colors ${
              s.ticker === ticker
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title={s.company_name}
          >
            {s.ticker}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="panel p-4 text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-foreground">Disclaimer: </span>
      This system provides educational insights based on historical market data. Predictions are not guaranteed
      and should not be treated as financial advice.
    </p>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "up" | "down" | "neutral";
}) {
  const toneClass =
    tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "neutral" ? "text-neutral" : "text-foreground";
  return (
    <div className="panel p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`num mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}