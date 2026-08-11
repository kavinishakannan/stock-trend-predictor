import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const tickerSchema = z
  .string()
  .trim()
  .min(1, "Enter a stock symbol")
  .max(12, "Symbol is too long")
  .regex(/^[A-Za-z0-9.\-&]+$/, "Symbol may only contain letters, numbers, dot or dash")
  .transform((v) => v.toUpperCase());

const rangeSchema = z.object({
  ticker: tickerSchema,
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, name, email").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as string);
    return {
      id: userId,
      name: profile?.name ?? "",
      email: profile?.email ?? "",
      role: roleList.includes("admin") ? "admin" : "analyst",
    };
  });

export const listStocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stocks")
      .select("id, ticker, company_name")
      .order("ticker");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { loadHistory } = await import("./stocks.server");
    return loadHistory(context.supabase, data.ticker, data.from, data.to);
  });

export const predictTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ ticker: tickerSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { runPredictionForTicker } = await import("./stocks.server");
    return runPredictionForTicker(context.supabase, context.userId, data.ticker);
  });

export const listPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("predictions")
      .select("id, ticker, prediction, confidence, risk_level, model_accuracy, prediction_date")
      .order("prediction_date", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminOverview } = await import("./stocks.server");
    return adminOverview(context.supabase, context.userId);
  });

export const addStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ ticker: tickerSchema, companyName: z.string().trim().min(2).max(120) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stocks")
      .insert({ ticker: data.ticker, company_name: data.companyName });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });