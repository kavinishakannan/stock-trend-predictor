import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { PredictionResult } from "./stock-types";

export const GENAI_MODEL = "google/gemini-3.6-flash";

const SYSTEM_PROMPT = `You are a financial data educator inside a student project about stock trend prediction.
You receive the raw output of a Random Forest classifier trained on historical OHLCV data.
Write a short educational commentary (120-180 words) in 3 tiny paragraphs:
1) what the model predicted and how strongly,
2) what the technical indicators (SMA5 vs SMA10, volatility, daily change) suggest,
3) what a cautious learner should watch next.
Never give buy/sell advice. Plain language, no markdown headings, no bullet lists.
End with one sentence reminding the reader this is educational, not financial advice.`;

export async function generateGenAiInsight(p: PredictionResult) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured (missing key).");

  const gateway = createLovableAiGatewayProvider(key);

  const prompt = [
    `Ticker: ${p.ticker} (${p.companyName})`,
    `Model prediction: ${p.trend}`,
    `Confidence: ${p.confidence}%`,
    `Model accuracy on unseen test days: ${p.modelAccuracy}%`,
    `Forest votes: UP ${p.votes.UP}%, DOWN ${p.votes.DOWN}%, NEUTRAL ${p.votes.NEUTRAL}%`,
    `Latest close: ${p.latestPrice}, previous close: ${p.previousClose} (${p.dailyChangePercent}%)`,
    `SMA5: ${p.sma5}, SMA10: ${p.sma10}`,
    `20-day volatility: ${p.volatility}%`,
    `Risk level: ${p.riskLevel}`,
    `Training rows: ${p.trainingRows}, test rows: ${p.testRows}`,
  ].join("\n");

  try {
    const result = streamText({
      model: gateway(GENAI_MODEL),
      system: SYSTEM_PROMPT,
      prompt,
    });
    const text = await result.text;
    return { model: GENAI_MODEL, text: text.trim(), generatedAt: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("429")) throw new Error("AI rate limit reached — please retry in a moment.");
    if (message.includes("402")) throw new Error("AI credits exhausted — add credits to continue.");
    throw new Error(`AI generation failed: ${message}`);
  }
}
