
CREATE TABLE public.scan_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NULL,
  barcode text NULL,
  product_name text NOT NULL,
  brand text NULL,
  status text NOT NULL,
  confidence integer NULL,
  verdict text NULL,
  category text NULL,
  region text NULL,
  ingredients_hash text NULL,
  ingredients jsonb NULL,
  raw_response jsonb NULL,
  scanned_at timestamp with time zone NULL DEFAULT now(),
  session_id text NULL
);

CREATE INDEX IF NOT EXISTS scan_history_scanned_at_idx ON public.scan_history USING btree (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_session ON public.scan_history USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_status ON public.scan_history USING btree (status);
CREATE INDEX IF NOT EXISTS idx_scan_history_region ON public.scan_history USING btree (region);
CREATE INDEX IF NOT EXISTS idx_scan_history_user ON public.scan_history USING btree (user_id);

GRANT SELECT, INSERT ON public.scan_history TO authenticated;
GRANT ALL ON public.scan_history TO service_role;

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scan history"
  ON public.scan_history FOR SELECT
  TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users insert own scan history"
  ON public.scan_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = (auth.jwt() ->> 'sub'));
