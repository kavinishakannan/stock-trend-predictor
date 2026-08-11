import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { usePrediction } from "@/lib/stock-queries";
import { Disclaimer, StatCard, StockSearch } from "@/components/stock/StockSearch";
import { RiskBadge, TrendBadge } from "@/components/stock/TrendBadge";
import { money } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/prediction")({
  validateSearch: (search) => z.object({ ticker: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Trend Prediction — TrendIQ" },
      { name: "description", content: "Random Forest trend prediction with confidence, votes and model accuracy." },
      { property: "og:title", content: "Trend Prediction — TrendIQ" },
      { property: "og:description", content: "See how the Random Forest votes on the next session's direction." },
    ],
  }),
  component: PredictionPage,
});

function PredictionPage() {
  const { ticker = "AAPL" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: p, isLoading, isError, error, isFetching } = usePrediction(ticker);
  const totalVotes = p ? p.votes.UP + p.votes.DOWN + p.votes.NEUTRAL : 0;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
      <header>
        <h1 className="text-2xl font-semibold lg:text-3xl">Trend prediction</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trend Prediction module: features are engineered, the forest is trained on an 80/20 chronological split,
          then every tree votes.
        </p>
      </header>

      <StockSearch ticker={ticker} busy={isFetching} onSelect={(next) => navigate({ search: { ticker: next } })} />

      {isLoading && (
        <div className="panel flex items-center gap-3 p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Growing decision trees…
        </div>
      )}
      {isError && <div className="panel p-6 text-sm text-down">{(error as Error).message}</div>}

      {p && (
        <>
          <section className="panel p-6 text-center">
            <p className="num text-xs tracking-widest text-muted-foreground uppercase">{p.ticker}</p>
            <div className="mt-3 flex justify-center">
              <TrendBadge trend={p.trend} className="px-5 py-2 text-lg" />
            </div>
            <p className="num mt-4 text-4xl font-semibold">{p.confidence.toFixed(1)}%</p>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Confidence</p>
            <div className="mt-4 flex justify-center">
              <RiskBadge risk={p.riskLevel} />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Forest vote distribution</h2>
            <div className="mt-4 space-y-4">
              {(["UP", "NEUTRAL", "DOWN"] as const).map((trend) => {
                const pct = totalVotes ? (p.votes[trend] / totalVotes) * 100 : 0;
                return (
                  <div key={trend}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="num">{trend}</span>
                      <span className="num text-muted-foreground">
                        {p.votes[trend]} trees · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-2" />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Model accuracy" value={`${p.modelAccuracy.toFixed(1)}%`} hint="On unseen test days" />
            <StatCard label="Training rows" value={String(p.trainingRows)} hint={`${p.testRows} test rows`} />
            <StatCard label="SMA 5" value={`₹${money(p.sma5)}`} hint={`SMA 10 · ₹${money(p.sma10)}`} />
            <StatCard label="Latest close" value={`₹${money(p.latestPrice)}`} hint={`Prev ₹${money(p.previousClose)}`} />
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Features used by the model</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {p.featureNames.map((f) => (
                <li key={f} className="num rounded-md border border-border px-3 py-2">
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Market context: <span className="text-foreground">{p.marketTrend}</span>
            </p>
          </section>
        </>
      )}

      <Disclaimer />
    </main>
  );
}