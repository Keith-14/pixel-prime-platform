
CREATE TABLE IF NOT EXISTS public.auth_email_otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.auth_email_otps TO service_role;

ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS auth_email_otps_expires_at_idx ON public.auth_email_otps(expires_at);
