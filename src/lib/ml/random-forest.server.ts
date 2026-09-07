/**
 * Minimal Random Forest Classifier (CART trees + Gini impurity + bagging).
 * Written from scratch so the whole machine-learning pipeline is visible and
 * explainable: no external ML dependency, no deep learning.
 */

export type Label = "UP" | "DOWN" | "NEUTRAL";

export const FEATURE_NAMES = [
  "Previous Close",
  "Close",
  "Open",
  "High",
  "Low",
  "Volume",
  "SMA (5)",
  "SMA (10)",
  "Daily Return %",
  "High-Low Range %",
] as const;

/** Deterministic PRNG so results are reproducible during a viva demo. */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node =
  | { leaf: true; probs: number[] }
  | { leaf: false; feature: number; threshold: number; left: Node; right: Node };

const CLASSES: Label[] = ["UP", "DOWN", "NEUTRAL"];

function classCounts(rows: number[], y: number[]): number[] {
  const counts = [0, 0, 0];
  for (const i of rows) counts[y[i]!] = counts[y[i]!]! + 1;
  return counts;
}

function gini(counts: number[]): number {
  const total = counts[0]! + counts[1]! + counts[2]!;
  if (total === 0) return 0;
  let sum = 0;
  for (const c of counts) {
    const p = c / total;
    sum += p * p;
  }
  return 1 - sum;
}

function leafFrom(counts: number[]): Node {
  const total = counts[0]! + counts[1]! + counts[2]! || 1;
  return { leaf: true, probs: counts.map((c) => c / total) };
}

function buildTree(
  X: number[][],
  y: number[],
  rows: number[],
  depth: number,
  maxDepth: number,
  minSamples: number,
  featuresPerSplit: number,
  rand: () => number,
  /** Accumulator for Gini-based feature importance (weighted impurity decrease). */
  importance: number[],
  rootSize: number,
): Node {
  const counts = classCounts(rows, y);
  const parentGini = gini(counts);
  if (depth >= maxDepth || rows.length < minSamples * 2 || parentGini === 0) {
    return leafFrom(counts);
  }

  const featureCount = X[0]!.length;
  const candidates: number[] = [];
  const pool = Array.from({ length: featureCount }, (_, i) => i);
  for (let k = 0; k < featuresPerSplit && pool.length > 0; k++) {
    candidates.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
  }

  let best: { feature: number; threshold: number; gain: number } | null = null;

  for (const feature of candidates) {
    const values = rows.map((i) => X[i]![feature]!).sort((a, b) => a - b);
    const thresholds: number[] = [];
    for (let q = 1; q <= 8; q++) {
      const v = values[Math.floor((values.length * q) / 9)];
      if (v !== undefined && !thresholds.includes(v)) thresholds.push(v);
    }
    for (const threshold of thresholds) {
      const leftCounts = [0, 0, 0];
      const rightCounts = [0, 0, 0];
      for (const i of rows) {
        const target = X[i]![feature]! <= threshold ? leftCounts : rightCounts;
        target[y[i]!] = target[y[i]!]! + 1;
      }
      const nLeft = leftCounts[0]! + leftCounts[1]! + leftCounts[2]!;
      const nRight = rows.length - nLeft;
      if (nLeft < minSamples || nRight < minSamples) continue;
      const gain =
        parentGini - (nLeft / rows.length) * gini(leftCounts) - (nRight / rows.length) * gini(rightCounts);
      if (!best || gain > best.gain) best = { feature, threshold, gain };
    }
  }

  if (!best || best.gain <= 1e-7) return leafFrom(counts);

  // Weighted impurity decrease, exactly like scikit-learn's feature_importances_.
  importance[best.feature] = importance[best.feature]! + (rows.length / rootSize) * best.gain;

  const leftRows: number[] = [];
  const rightRows: number[] = [];
  for (const i of rows) {
    if (X[i]![best.feature]! <= best.threshold) leftRows.push(i);
    else rightRows.push(i);
  }

  return {
    leaf: false,
    feature: best.feature,
    threshold: best.threshold,
    left: buildTree(X, y, leftRows, depth + 1, maxDepth, minSamples, featuresPerSplit, rand, importance, rootSize),
    right: buildTree(X, y, rightRows, depth + 1, maxDepth, minSamples, featuresPerSplit, rand, importance, rootSize),
  };
}

function predictTree(node: Node, row: number[]): number[] {
  let current = node;
  while (!current.leaf) {
    current = row[current.feature]! <= current.threshold ? current.left : current.right;
  }
  return current.probs;
}

export interface Forest {
  trees: Node[];
  /** Normalised Gini importance per feature (sums to 1 when the forest split at all). */
  featureImportances: number[];
}

export function trainForest(
  X: number[][],
  y: number[],
  options: { trees?: number; maxDepth?: number; minSamples?: number; seed?: number } = {},
): Forest {
  const { trees = 60, maxDepth = 8, minSamples = 4, seed = 7 } = options;
  const rand = makeRandom(seed);
  const featureCount = X[0]!.length;
  const featuresPerSplit = Math.max(2, Math.round(Math.sqrt(featureCount)));
  const forest: Node[] = [];
  const importance = new Array<number>(featureCount).fill(0);

  for (let t = 0; t < trees; t++) {
    // Bootstrap sample (bagging)
    const rows: number[] = [];
    for (let i = 0; i < X.length; i++) rows.push(Math.floor(rand() * X.length));
    forest.push(
      buildTree(X, y, rows, 0, maxDepth, minSamples, featuresPerSplit, rand, importance, rows.length || 1),
    );
  }

  const total = importance.reduce((a, b) => a + b, 0);
  const featureImportances = total > 0 ? importance.map((v) => v / total) : importance.map(() => 0);

  return { trees: forest, featureImportances };
}

/** Majority vote across trees, returning the winning class, vote share and raw tree counts. */
export function forestPredict(
  forest: Forest,
  row: number[],
): { label: Label; probs: number[]; counts: number[]; treeCount: number } {
  const totals = [0, 0, 0];
  for (const tree of forest.trees) {
    const probs = predictTree(tree, row);
    let bestIdx = 0;
    for (let c = 1; c < 3; c++) if (probs[c]! > probs[bestIdx]!) bestIdx = c;
    totals[bestIdx] = totals[bestIdx]! + 1;
  }
  let bestIdx = 0;
  for (let c = 1; c < 3; c++) if (totals[c]! > totals[bestIdx]!) bestIdx = c;
  const total = forest.trees.length || 1;
  return {
    label: CLASSES[bestIdx]!,
    probs: totals.map((v) => v / total),
    counts: totals,
    treeCount: forest.trees.length,
  };
}

export function labelToIndex(label: Label): number {
  return CLASSES.indexOf(label);
}

export function indexToLabel(index: number): Label {
  return CLASSES[index]!;
}

export const CLASS_ORDER = CLASSES;
