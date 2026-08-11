import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useHistory } from "@/lib/stock-queries";
import { Disclaimer, StatCard, StockSearch } from "@/components/stock/StockSearch";
import { PriceChart } from "@/components/stock/PriceChart";
import { compactVolume, money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analysis")({
  validateSearch: (search) => z.object({ ticker: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Stock Analysis — TrendIQ" },
      { name: "description", content: "Explore collected historical prices, volume and moving-average behaviour." },
      { property: "og:title", content: "Stock Analysis — TrendIQ" },
      { property: "og:description", content: "Historical price and volume analysis for seeded tickers." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { ticker = "AAPL" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading, isError } = useHistory(ticker);
  const rows = data?.rows ?? [];
  const last = rows.at(-1);
  const first = rows[0];
  const changePct = first && last ? ((last.close - first.close) / first.close) * 100 : 0;
  const highest = rows.reduce((max, r) => Math.max(max, r.high), 0);
  const lowest = rows.length ? rows.reduce((min, r) => Math.min(min, r.low), Infinity) : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
      <header>
        <h1 className="text-2xl font-semibold lg:text-3xl">Stock analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Data Collection module output: cleaned OHLCV rows stored in the database.
        </p>
      </header>

      <StockSearch ticker={ticker} onSelect={(next) => navigate({ search: { ticker: next } })} />

      {isLoading && <div className="panel p-8 text-sm text-muted-foreground">Loading historical data…</div>}
      {isError && <div className="panel p-6 text-sm text-down">No historical data found for {ticker}.</div>}

      {rows.length > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Trading days" value={String(rows.length)} hint={data?.companyName} />
            <StatCard
              label="Period change"
              value={`${changePct.toFixed(2)}%`}
              hint={`${shortDate(first!.price_date)} → ${shortDate(last!.price_date)}`}
              tone={changePct >= 0 ? "up" : "down"}
            />
            <StatCard label="Period high" value={`₹${money(highest)}`} />
            <StatCard label="Period low" value={`₹${money(lowest)}`} />
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Closing price history</h2>
            <div className="mt-4">
              <PriceChart rows={rows} height={360} />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Latest 30 sessions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-right font-medium">Open</th>
                    <th className="py-2 text-right font-medium">High</th>
                    <th className="py-2 text-right font-medium">Low</th>
                    <th className="py-2 text-right font-medium">Close</th>
                    <th className="py-2 text-right font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {rows
                    .slice(-30)
                    .reverse()
                    .map((r) => (
                      <tr key={r.price_date} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5">{shortDate(r.price_date)}</td>
                        <td className="py-2.5 text-right">{money(r.open)}</td>
                        <td className="py-2.5 text-right">{money(r.high)}</td>
                        <td className="py-2.5 text-right">{money(r.low)}</td>
                        <td
                          className={`py-2.5 text-right ${r.close >= r.open ? "text-up" : "text-down"}`}
                        >
                          {money(r.close)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">{compactVolume(r.volume)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Disclaimer />
    </main>
  );
}