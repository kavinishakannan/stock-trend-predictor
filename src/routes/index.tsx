import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, Brain, Lightbulb, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrendIQ — Intelligent Stock Trend Prediction System" },
      {
        name: "description",
        content:
          "Predict whether a stock is likely to move UP, DOWN or stay NEUTRAL using a Random Forest classifier trained on historical market data. Educational project.",
      },
      { property: "og:title", content: "TrendIQ — Intelligent Stock Trend Prediction System" },
      {
        property: "og:description",
        content: "Random Forest trend prediction, confidence scores and investment insights from historical data.",
      },
    ],
  }),
  component: Landing,
});

const modules = [
  {
    icon: BarChart3,
    title: "Module 1 — Stock Data Collection",
    body: "Search a ticker, pick a date range and review open, high, low, close and volume in a table and chart.",
  },
  {
    icon: Brain,
    title: "Module 2 — Trend Prediction",
    body: "A Random Forest classifier trained on engineered features predicts UP, DOWN or NEUTRAL with a confidence score.",
  },
  {
    icon: Lightbulb,
    title: "Module 3 — Investment Insight",
    body: "The prediction is translated into a plain-language market outlook with a simple risk level.",
  },
  {
    icon: LineChart,
    title: "Module 4 — Dashboard",
    body: "Price cards, historical charts, prediction and insight combined into one clean dashboard.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Activity className="size-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">TrendIQ</span>
        </div>
        <Button asChild variant="secondary">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20">
        <p className="num text-xs uppercase tracking-[0.25em] text-primary">Machine Learning · Random Forest</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-6xl">
          Intelligent Stock Trend Prediction System
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          TrendIQ studies historical market data, engineers simple features such as moving averages and daily
          returns, and uses a Random Forest classifier to indicate whether a stock is likely to move
          <span className="text-up"> UP</span>, <span className="text-down">DOWN</span> or stay
          <span className="text-neutral"> NEUTRAL</span> — with a real, measured model accuracy.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Sign in to the dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create an analyst account
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <article key={m.title} className="panel p-6">
              <m.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{m.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>

        <div className="panel mt-6 flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
          <p>
            This system provides educational insights based on historical market data. Predictions are not
            guaranteed and should not be treated as financial advice.
          </p>
        </div>
      </section>
    </main>
  );
}