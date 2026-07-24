-- Stores short-lived signup email OTP challenges.
-- Users never read this table directly; the auth-email-otp Edge Function
-- accesses it with the service role key.

CREATE TABLE IF NOT EXISTS public.auth_email_otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.auth_email_otps TO service_role;

ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage auth email otps"
    ON public.auth_email_otps FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_auth_email_otps_expires_at
  ON public.auth_email_otps(expires_at);
