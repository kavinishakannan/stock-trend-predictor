import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useHistory, usePrediction, usePredictionHistory } from "@/lib/stock-queries";
import { Disclaimer, StatCard, StockSearch } from "@/components/stock/StockSearch";
import { PriceChart } from "@/components/stock/PriceChart";
import { RiskBadge, TrendBadge } from "@/components/stock/TrendBadge";
import { compactVolume, dateTime, money } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search) => z.object({ ticker: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Dashboard — TrendIQ Stock Trend Prediction" },
      { name: "description", content: "Run the Random Forest model and review trends, accuracy and insights." },
      { property: "og:title", content: "TrendIQ Dashboard" },
      { property: "og:description", content: "Machine-learning stock trend dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { ticker = "AAPL" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const prediction = usePrediction(ticker);
  const history = useHistory(ticker);
  const recent = usePredictionHistory();
  const p = prediction.data;
  const rows = (history.data?.rows ?? []).slice(-90);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
      <header>
        <h1 className="text-2xl font-semibold lg:text-3xl">Prediction dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Random Forest trained live on seeded historical prices, then asked for tomorrow's direction.
        </p>
      </header>

      <StockSearch
        ticker={ticker}
        busy={prediction.isFetching}
        onSelect={(next) => navigate({ search: { ticker: next } })}
      />

      {prediction.isLoading && (
        <div className="panel flex items-center gap-3 p-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Training the model on historical data…
        </div>
      )}

      {prediction.isError && (
        <div className="panel p-6 text-sm text-down">
          {(prediction.error as Error).message || "Could not run the prediction for this symbol."}
        </div>
      )}

      {p && (
        <>
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="num text-xs tracking-widest text-muted-foreground uppercase">{p.ticker}</p>
                <h2 className="mt-1 text-xl font-semibold">{p.companyName}</h2>
                <p className="num mt-2 text-3xl font-semibold">₹{money(p.latestPrice)}</p>
                <p
                  className={`num mt-1 text-sm ${p.dailyChange >= 0 ? "text-up" : "text-down"}`}
                >
                  {p.dailyChange >= 0 ? "+" : ""}
                  {money(p.dailyChange)} ({p.dailyChangePercent.toFixed(2)}%) last session
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <TrendBadge trend={p.trend} className="text-base" />
                <RiskBadge risk={p.riskLevel} />
                <p className="text-xs text-muted-foreground">Predicted {dateTime(p.predictionDate)}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Confidence"
              value={`${p.confidence.toFixed(1)}%`}
              hint="Share of trees voting for this trend"
              tone={p.trend === "UP" ? "up" : p.trend === "DOWN" ? "down" : "neutral"}
            />
            <StatCard label="Model accuracy" value={`${p.modelAccuracy.toFixed(1)}%`} hint={`${p.testRows} unseen test days`} />
            <StatCard label="Volatility (10d)" value={`${p.volatility.toFixed(2)}%`} hint="Std. dev of daily returns" />
            <StatCard label="Volume" value={compactVolume(p.volume)} hint="Latest session" />
          </section>

          <section className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Last 90 sessions</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/analysis" search={{ ticker }}>
                  Full analysis →
                </Link>
              </Button>
            </div>
            <div className="mt-4">
              <PriceChart rows={rows} />
            </div>
          </section>

          <section className="panel p-6">
            <h3 className="text-lg font-semibold">{p.insightTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.insightBody}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/insights" search={{ ticker }}>
                Investment insight
              </Link>
            </Button>
          </section>
        </>
      )}

      {(recent.data ?? []).length > 0 && (
        <section className="panel p-6">
          <h3 className="text-lg font-semibold">Recent predictions</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium">Symbol</th>
                  <th className="py-2 text-left font-medium">Trend</th>
                  <th className="py-2 text-right font-medium">Confidence</th>
                  <th className="py-2 text-right font-medium">Accuracy</th>
                  <th className="py-2 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {(recent.data ?? []).slice(0, 10).map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="num py-2.5">{row.ticker}</td>
                    <td className="py-2.5">
                      <TrendBadge trend={row.prediction as "UP" | "DOWN" | "NEUTRAL"} className="text-xs" />
                    </td>
                    <td className="num py-2.5 text-right">{Number(row.confidence).toFixed(1)}%</td>
                    <td className="num py-2.5 text-right">{Number(row.model_accuracy).toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-muted-foreground">{dateTime(row.prediction_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Disclaimer />
    </main>
  );
}