import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { addStock, getAdminOverview, removeStock } from "@/lib/stocks.functions";
import { StatCard } from "@/components/stock/StockSearch";
import { TrendBadge } from "@/components/stock/TrendBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TrendIQ" },
      { name: "description", content: "Admin console for users, tracked stocks and prediction activity." },
      { property: "og:title", content: "Admin — TrendIQ" },
      { property: "og:description", content: "Manage users and tracked stocks in TrendIQ." },
    ],
  }),
  component: AdminPage,
});

const newStockSchema = z.object({
  ticker: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9.\-&]+$/, "Invalid symbol"),
  companyName: z.string().trim().min(2, "Company name is too short").max(120),
});

function AdminPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const createStock = useServerFn(addStock);
  const deleteStock = useServerFn(removeStock);
  const queryClient = useQueryClient();
  const [ticker, setTicker] = useState("");
  const [company, setCompany] = useState("");

  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview(), retry: false });

  const add = useMutation({
    mutationFn: (input: { ticker: string; companyName: string }) => createStock({ data: input }),
    onSuccess: () => {
      toast.success("Stock added");
      setTicker("");
      setCompany("");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStock({ data: { id } }),
    onSuccess: () => {
      toast.success("Stock removed");
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (overview.isError) {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-10 lg:px-8">
        <div className="panel p-8 text-center">
          <h1 className="text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has the Analyst role. Ask an administrator to grant admin access.
          </p>
        </div>
      </main>
    );
  }

  const data = overview.data;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 pb-16 pt-4 lg:px-8 lg:pt-8">
      <header>
        <h1 className="text-2xl font-semibold lg:text-3xl">Admin console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage users, tracked stocks and review prediction activity.</p>
      </header>

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={String(data.stats.totalUsers)} />
            <StatCard label="Tracked stocks" value={String(data.stats.totalStocks)} />
            <StatCard label="Predictions" value={String(data.stats.totalPredictions)} />
            <StatCard label="Avg confidence" value={`${data.stats.avgConfidence}%`} />
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Add a stock</h2>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = newStockSchema.safeParse({ ticker, companyName: company });
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]?.message ?? "Check the values");
                  return;
                }
                add.mutate({ ticker: parsed.data.ticker.toUpperCase(), companyName: parsed.data.companyName });
              }}
            >
              <div className="sm:w-40">
                <label htmlFor="new-ticker" className="text-xs tracking-wide text-muted-foreground uppercase">
                  Symbol
                </label>
                <Input
                  id="new-ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="NVDA"
                  maxLength={12}
                  className="num mt-1.5"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="new-company" className="text-xs tracking-wide text-muted-foreground uppercase">
                  Company name
                </label>
                <Input
                  id="new-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="NVIDIA Corporation"
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" disabled={add.isPending}>
                <Plus className="size-4" /> Add
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              New symbols need historical price rows before the model can train on them.
            </p>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Tracked stocks</h2>
            <ul className="mt-4 divide-y divide-border">
              {data.stocks.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="num text-sm font-medium">{s.ticker}</p>
                    <p className="text-xs text-muted-foreground">{s.company_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(s.id)}
                    aria-label={`Remove ${s.ticker}`}
                  >
                    <Trash2 className="size-4 text-down" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Email</th>
                    <th className="py-2 text-left font-medium">Role</th>
                    <th className="py-2 text-right font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5">{u.name || "—"}</td>
                      <td className="py-2.5 text-muted-foreground">{u.email}</td>
                      <td className="py-2.5">
                        <Badge variant="secondary" className="uppercase">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{dateTime(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Prediction activity</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Symbol</th>
                    <th className="py-2 text-left font-medium">Trend</th>
                    <th className="py-2 text-right font-medium">Confidence</th>
                    <th className="py-2 text-right font-medium">Risk</th>
                    <th className="py-2 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.predictions.slice(0, 20).map((p) => (
                    <tr key={p.id as string} className="border-b border-border/60 last:border-0">
                      <td className="num py-2.5">{p.ticker as string}</td>
                      <td className="py-2.5">
                        <TrendBadge trend={p.prediction as "UP" | "DOWN" | "NEUTRAL"} className="text-xs" />
                      </td>
                      <td className="num py-2.5 text-right">{Number(p.confidence).toFixed(1)}%</td>
                      <td className="py-2.5 text-right text-muted-foreground">{p.risk_level as string}</td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {dateTime(p.prediction_date as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}