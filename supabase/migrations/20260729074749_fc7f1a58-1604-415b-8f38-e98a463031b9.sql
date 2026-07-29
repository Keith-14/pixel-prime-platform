ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS is_islamic boolean,
  ADD COLUMN IF NOT EXISTS ai_category text;