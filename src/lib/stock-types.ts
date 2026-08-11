export type Trend = "UP" | "DOWN" | "NEUTRAL";
export type RiskLevel = "Low" | "Medium" | "High";

export interface PriceRow {
  price_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  ticker: string;
  companyName: string;
  trend: Trend;
  confidence: number;
  riskLevel: RiskLevel;
  modelAccuracy: number;
  latestPrice: number;
  previousClose: number;
  dailyChange: number;
  dailyChangePercent: number;
  volume: number;
  sma5: number;
  sma10: number;
  volatility: number;
  votes: { UP: number; DOWN: number; NEUTRAL: number };
  trainingRows: number;
  testRows: number;
  featureNames: string[];
  marketTrend: string;
  insightTitle: string;
  insightBody: string;
  outlook: string;
  predictionDate: string;
}

export const TREND_EMOJI: Record<Trend, string> = {
  UP: "📈",
  DOWN: "📉",
  NEUTRAL: "➡️",
};