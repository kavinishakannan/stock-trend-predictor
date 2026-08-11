import type { PredictionResult, PriceRow, RiskLevel, Trend } from "../stock-types";
import { FEATURE_NAMES, forestPredict, labelToIndex, trainForest, type Label } from "./random-forest.server";

const THRESHOLD = 0.005; // +/-0.5% decides UP / DOWN, anything smaller is NEUTRAL

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Step 1+2: clean rows (drop missing / invalid values) and sort chronologically. */
export function cleanPrices(rows: PriceRow[]): PriceRow[] {
  return rows
    .filter(
      (r) =>
        r.price_date &&
        [r.open, r.high, r.low, r.close, r.volume].every((v) => Number.isFinite(Number(v)) && Number(v) > 0),
    )
    .map((r) => ({
      price_date: String(r.price_date),
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
    }))
    .sort((a, b) => a.price_date.localeCompare(b.price_date));
}

/** Step 3: feature creation. */
function buildFeatureRow(rows: PriceRow[], i: number): number[] {
  const row = rows[i]!;
  const prev = rows[i - 1]!;
  const sma5 = mean(rows.slice(i - 4, i + 1).map((r) => r.close));
  const sma10 = mean(rows.slice(i - 9, i + 1).map((r) => r.close));
  const dailyReturn = ((row.close - prev.close) / prev.close) * 100;
  const range = ((row.high - row.low) / row.close) * 100;
  return [
    prev.close,
    row.close,
    row.open,
    row.high,
    row.low,
    row.volume / 1_000_000,
    sma5,
    sma10,
    dailyReturn,
    range,
  ];
}

function labelFor(current: number, next: number): Label {
  const change = (next - current) / current;
  if (change > THRESHOLD) return "UP";
  if (change < -THRESHOLD) return "DOWN";
  return "NEUTRAL";
}

function riskFor(confidence: number, volatility: number): RiskLevel {
  const score = (100 - confidence) / 100 + volatility / 3;
  if (score < 0.45) return "Low";
  if (score < 0.8) return "Medium";
  return "High";
}

const INSIGHTS: Record<Trend, { marketTrend: string; body: string; outlook: string }> = {
  UP: {
    marketTrend: "Positive",
    body: "The model identifies an upward trend based on historical stock patterns.",
    outlook: "Positive outlook.",
  },
  DOWN: {
    marketTrend: "Negative",
    body: "The model identifies a downward trend based on historical stock patterns.",
    outlook: "Cautious outlook.",
  },
  NEUTRAL: {
    marketTrend: "Neutral",
    body: "The model does not identify a strong upward or downward trend.",
    outlook: "Wait and observe.",
  },
};

function confidenceWord(confidence: number): string {
  if (confidence >= 75) return "high";
  if (confidence >= 55) return "moderate";
  return "low";
}

/**
 * Full pipeline: clean -> features -> target -> chronological split ->
 * train Random Forest -> test -> predict -> confidence.
 */
export function runPipeline(
  ticker: string,
  companyName: string,
  rawRows: PriceRow[],
): PredictionResult {
  const rows = cleanPrices(rawRows);
  if (rows.length < 60) {
    throw new Error("Not enough historical data for this stock (at least 60 trading days required).");
  }

  const X: number[][] = [];
  const y: number[] = [];
  // Features need 9 previous closes for SMA(10); target needs the next day.
  for (let i = 9; i < rows.length - 1; i++) {
    X.push(buildFeatureRow(rows, i));
    y.push(labelToIndex(labelFor(rows[i]!.close, rows[i + 1]!.close)));
  }

  const splitAt = Math.floor(X.length * 0.8); // chronological train/test split
  const trainX = X.slice(0, splitAt);
  const trainY = y.slice(0, splitAt);
  const testX = X.slice(splitAt);
  const testY = y.slice(splitAt);

  const forest = trainForest(trainX, trainY, { trees: 60, maxDepth: 8, minSamples: 4, seed: 11 });

  let correct = 0;
  for (let i = 0; i < testX.length; i++) {
    const { label } = forestPredict(forest, testX[i]!);
    if (labelToIndex(label) === testY[i]) correct++;
  }
  const modelAccuracy = testX.length > 0 ? (correct / testX.length) * 100 : 0;

  // Predict the trend for the most recent trading day.
  const latestFeatures = buildFeatureRow(rows, rows.length - 1);
  const { label, probs } = forestPredict(forest, latestFeatures);
  const confidence = Math.max(...probs) * 100;

  const last = rows[rows.length - 1]!;
  const prev = rows[rows.length - 2]!;
  const recentReturns = rows
    .slice(-21)
    .map((r, idx, arr) => (idx === 0 ? 0 : ((r.close - arr[idx - 1]!.close) / arr[idx - 1]!.close) * 100))
    .slice(1);
  const volatility = stdDev(recentReturns);
  const riskLevel = riskFor(confidence, volatility);
  const info = INSIGHTS[label];

  return {
    ticker,
    companyName,
    trend: label,
    confidence: Math.round(confidence * 10) / 10,
    riskLevel,
    modelAccuracy: Math.round(modelAccuracy * 10) / 10,
    latestPrice: last.close,
    previousClose: prev.close,
    dailyChange: Math.round((last.close - prev.close) * 100) / 100,
    dailyChangePercent: Math.round(((last.close - prev.close) / prev.close) * 10000) / 100,
    volume: last.volume,
    sma5: Math.round(latestFeatures[6]! * 100) / 100,
    sma10: Math.round(latestFeatures[7]! * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    votes: {
      UP: Math.round(probs[0]! * 1000) / 10,
      DOWN: Math.round(probs[1]! * 1000) / 10,
      NEUTRAL: Math.round(probs[2]! * 1000) / 10,
    },
    trainingRows: trainX.length,
    testRows: testX.length,
    featureNames: [...FEATURE_NAMES],
    marketTrend: info.marketTrend,
    insightTitle: `AI Insight — ${ticker}`,
    insightBody: `${info.body} The historical data indicates a ${info.marketTrend.toLowerCase()} short-term trend, and the model has ${confidenceWord(confidence)} confidence in this prediction. Recent 20-day volatility is ${(Math.round(volatility * 100) / 100).toFixed(2)}%, giving a ${riskLevel.toLowerCase()} risk level.`,
    outlook: info.outlook,
    predictionDate: new Date().toISOString(),
  };
}