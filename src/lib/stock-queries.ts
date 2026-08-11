import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHistory, listPredictions, listStocks, predictTrend } from "./stocks.functions";

export function useStocks() {
  const fetchStocks = useServerFn(listStocks);
  return useQuery({ queryKey: ["stocks"], queryFn: () => fetchStocks(), staleTime: 300_000 });
}

export function useHistory(ticker: string, from?: string, to?: string) {
  const fetchHistory = useServerFn(getHistory);
  return useQuery({
    queryKey: ["history", ticker, from ?? "", to ?? ""],
    queryFn: () => fetchHistory({ data: { ticker, from, to } }),
    enabled: ticker.length > 0,
    staleTime: 300_000,
  });
}

/** Runs the full ML pipeline server-side and stores the prediction. */
export function usePrediction(ticker: string, enabled = true) {
  const runPrediction = useServerFn(predictTrend);
  return useQuery({
    queryKey: ["prediction", ticker],
    queryFn: () => runPrediction({ data: { ticker } }),
    enabled: enabled && ticker.length > 0,
    staleTime: Infinity,
    retry: false,
  });
}

export function usePredictionHistory() {
  const fetchPredictions = useServerFn(listPredictions);
  return useQuery({ queryKey: ["predictions"], queryFn: () => fetchPredictions() });
}