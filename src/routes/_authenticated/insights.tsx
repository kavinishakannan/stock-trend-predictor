import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, TrendingUp } from "lucide-react";
import { usePrediction } from "@/lib/stock-queries";
import { Disclaimer, StatCard, StockSearch } from "@/components/stock/StockSearch";
import { RiskBadge, TrendBadge } from "@/components/stock/TrendBadge";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/insights")({
  validateSearch: (search) => z.object({ ticker: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Investment Insights — TrendIQ" },
      { name: "description", content: "Plain-language investment outlook and risk level derived from the model." },
      { property: "og:title", content: "Investment Insights — TrendIQ" },
      { property: "og:description", content: "Educational investment outlook generated from model confidence and volatility." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { ticker = "AAPL" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: p, isLoading, isError, error, isFetching } = usePrediction(ticker);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
      <header>
        <h1 className="text-2xl font-semibold lg:text-3xl">Investment insight</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Investment Insight module: converts the model output into a readable outlook and a risk rating.
        </p>
      </header>

      <StockSearch ticker={ticker} busy={isFetching} onSelect={(next) => navigate({ search: { ticker: next } })} />

      {isLoading && (
        <div className="panel flex items-center gap-3 p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Preparing insight…
        </div>
      )}
      {isError && <div className="panel p-6 text-sm text-down">{(error as Error).message}</div>}

      {p && (
        <>
          <section className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="num text-xs tracking-widest text-muted-foreground uppercase">
                  {p.ticker} · {p.companyName}
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold">
                  <TrendingUp className="size-5 text-primary" />
                  {p.insightTitle}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <TrendBadge trend={p.trend} />
                <RiskBadge risk={p.riskLevel} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.insightBody}</p>
          </section>

          <section className="panel p-6">
            <h3 className="text-lg font-semibold">Suggested outlook</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.outlook}</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Confidence"
              value={`${p.confidence.toFixed(1)}%`}
              tone={p.trend === "UP" ? "up" : p.trend === "DOWN" ? "down" : "neutral"}
            />
            <StatCard label="Risk" value={p.riskLevel} hint={`Volatility ${p.volatility.toFixed(2)}%`} />
            <StatCard label="Model accuracy" value={`${p.modelAccuracy.toFixed(1)}%`} />
            <StatCard label="Latest close" value={`₹${money(p.latestPrice)}`} hint={p.marketTrend} />
          </section>
        </>
      )}

      <Disclaimer />
    </main>
  );
}