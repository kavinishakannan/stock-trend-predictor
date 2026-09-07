ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS latest_close NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS sma5 NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS sma10 NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS volatility NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS market_context TEXT,
  ADD COLUMN IF NOT EXISTS precision_macro NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS recall_macro NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS f1_macro NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS training_samples INTEGER,
  ADD COLUMN IF NOT EXISTS testing_samples INTEGER;

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  trend TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Medium',
  volatility NUMERIC(8,4),
  model_accuracy NUMERIC(5,2),
  ai_model TEXT NOT NULL DEFAULT '',
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_insights_created_idx ON public.ai_insights (created_at DESC);

GRANT SELECT, INSERT ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_insights_select" ON public.ai_insights;
CREATE POLICY "ai_insights_select" ON public.ai_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ai_insights_insert_own" ON public.ai_insights;
CREATE POLICY "ai_insights_insert_own" ON public.ai_insights FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);