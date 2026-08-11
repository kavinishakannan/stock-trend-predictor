import type { SupabaseClient } from "@supabase/supabase-js";
import { runPipeline } from "./ml/pipeline.server";
import type { PredictionResult, PriceRow } from "./stock-types";

type Client = SupabaseClient<any, "public", any>;

export async function loadHistory(
  supabase: Client,
  ticker: string,
  from?: string,
  to?: string,
): Promise<{ ticker: string; companyName: string; rows: PriceRow[] }> {
  const { data: stock } = await supabase
    .from("stocks")
    .select("ticker, company_name")
    .eq("ticker", ticker)
    .maybeSingle();

  let query = supabase
    .from("stock_prices")
    .select("price_date, open, high, low, close, volume")
    .eq("ticker", ticker)
    .order("price_date", { ascending: true });

  if (from) query = query.gte("price_date", from);
  if (to) query = query.lte("price_date", to);

  const { data, error } = await query.limit(1000);
  if (error) throw new Error(error.message);

  const rows: PriceRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
    price_date: String(r["price_date"]),
    open: Number(r["open"]),
    high: Number(r["high"]),
    low: Number(r["low"]),
    close: Number(r["close"]),
    volume: Number(r["volume"]),
  }));

  return { ticker, companyName: stock?.company_name ?? ticker, rows };
}

export async function runPredictionForTicker(
  supabase: Client,
  userId: string,
  ticker: string,
): Promise<PredictionResult> {
  const { rows, companyName } = await loadHistory(supabase, ticker);
  if (rows.length === 0) {
    throw new Error(`No historical data found for "${ticker}". Try one of the listed stocks.`);
  }

  const result = runPipeline(ticker, companyName, rows);

  const { error } = await supabase.from("predictions").insert({
    user_id: userId,
    ticker: result.ticker,
    prediction: result.trend,
    confidence: result.confidence,
    risk_level: result.riskLevel,
    model_accuracy: result.modelAccuracy,
  });
  if (error) throw new Error(error.message);

  return result;
}

export async function adminOverview(supabase: Client, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden: admin access required.");

  const [users, stocks, predictions] = await Promise.all([
    supabase.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }),
    supabase.from("stocks").select("id, ticker, company_name").order("ticker"),
    supabase
      .from("predictions")
      .select("id, ticker, prediction, confidence, risk_level, model_accuracy, prediction_date")
      .order("prediction_date", { ascending: false })
      .limit(100),
  ]);

  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const roleMap = new Map<string, string>();
  for (const r of roles ?? []) roleMap.set(r.user_id as string, r.role as string);

  const rows = predictions.data ?? [];
  const counts = { UP: 0, DOWN: 0, NEUTRAL: 0 } as Record<string, number>;
  for (const p of rows) counts[p.prediction as string] = (counts[p.prediction as string] ?? 0) + 1;

  return {
    users: (users.data ?? []).map((u) => ({
      id: u.id as string,
      name: u.name as string,
      email: u.email as string,
      created_at: u.created_at as string,
      role: roleMap.get(u.id as string) ?? "analyst",
    })),
    stocks: stocks.data ?? [],
    predictions: rows,
    stats: {
      totalUsers: (users.data ?? []).length,
      totalStocks: (stocks.data ?? []).length,
      totalPredictions: rows.length,
      avgConfidence:
        rows.length > 0
          ? Math.round((rows.reduce((a, b) => a + Number(b.confidence), 0) / rows.length) * 10) / 10
          : 0,
      trendCounts: counts,
    },
  };
}