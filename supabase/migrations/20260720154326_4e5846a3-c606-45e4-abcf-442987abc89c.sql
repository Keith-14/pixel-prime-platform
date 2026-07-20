
-- =========================================================
-- notifications
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "own_notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "own_notifications_delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
-- inserts only via service_role (edge functions / triggers)

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- =========================================================
-- notification_preferences
-- =========================================================
CREATE TABLE public.notification_preferences (
  user_id text PRIMARY KEY,
  prayer_in_app boolean NOT NULL DEFAULT true,
  prayer_push boolean NOT NULL DEFAULT true,
  prayer_email boolean NOT NULL DEFAULT false,
  marketplace_in_app boolean NOT NULL DEFAULT true,
  marketplace_push boolean NOT NULL DEFAULT true,
  marketplace_email boolean NOT NULL DEFAULT true,
  community_in_app boolean NOT NULL DEFAULT true,
  community_push boolean NOT NULL DEFAULT true,
  community_email boolean NOT NULL DEFAULT false,
  news_in_app boolean NOT NULL DEFAULT true,
  news_push boolean NOT NULL DEFAULT false,
  news_email boolean NOT NULL DEFAULT false,
  hajj_in_app boolean NOT NULL DEFAULT true,
  hajj_push boolean NOT NULL DEFAULT true,
  hajj_email boolean NOT NULL DEFAULT true,
  ai_in_app boolean NOT NULL DEFAULT true,
  ai_push boolean NOT NULL DEFAULT false,
  ai_email boolean NOT NULL DEFAULT false,
  system_in_app boolean NOT NULL DEFAULT true,
  system_push boolean NOT NULL DEFAULT true,
  system_email boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_prefs_all" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- push_tokens
-- =========================================================
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  device_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_push_tokens_all" ON public.push_tokens
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- Trigger helpers: insert notification rows directly
-- (Avoids pg_net/http round-trips; dispatcher-only extras like push/email
-- can be layered later by a listener on notifications table.)
-- =========================================================

CREATE OR REPLACE FUNCTION public.notify_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_title text;
  buyer_body text;
  seller_title text;
  seller_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    buyer_title := 'Order placed';
    buyer_body := 'Your order #' || substr(NEW.id::text,1,8) || ' has been placed successfully.';
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (NEW.user_id, 'marketplace_buyer', buyer_title, buyer_body,
            '/order-confirmation/' || NEW.id::text,
            jsonb_build_object('order_id', NEW.id, 'status', NEW.status));

    IF NEW.seller_id IS NOT NULL THEN
      seller_title := 'New order received';
      seller_body := 'You have a new order to fulfill.';
      INSERT INTO public.notifications(user_id, category, title, body, link, data)
      VALUES (NEW.seller_id, 'marketplace_seller', seller_title, seller_body,
              '/seller/orders/' || NEW.id::text,
              jsonb_build_object('order_id', NEW.id, 'status', NEW.status));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (NEW.user_id, 'marketplace_buyer',
            'Order update',
            'Your order #' || substr(NEW.id::text,1,8) || ' is now ' || NEW.status::text || '.',
            '/order-confirmation/' || NEW.id::text,
            jsonb_build_object('order_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_order_insert
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_change();

CREATE TRIGGER trg_notify_order_update
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_change();

-- Community: replies
CREATE OR REPLACE FUNCTION public.notify_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author text;
BEGIN
  SELECT user_id INTO post_author FROM public.guftagu_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (post_author, 'community',
            COALESCE(NEW.user_name,'Someone') || ' replied to your post',
            LEFT(NEW.content, 140),
            '/forum',
            jsonb_build_object('post_id', NEW.post_id, 'reply_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_reply
AFTER INSERT ON public.guftagu_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_reply();

-- Community: likes
CREATE OR REPLACE FUNCTION public.notify_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author text;
BEGIN
  SELECT user_id INTO post_author FROM public.guftagu_posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (post_author, 'community',
            'Someone liked your post',
            null,
            '/forum',
            jsonb_build_object('post_id', NEW.post_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_like
AFTER INSERT ON public.guftagu_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_like();

-- Hajj bookings
CREATE OR REPLACE FUNCTION public.notify_hajj_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (NEW.user_id, 'hajj',
            'Hajj booking received',
            'Your Hajj booking is pending confirmation.',
            '/hajj',
            jsonb_build_object('booking_id', NEW.id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id, category, title, body, link, data)
    VALUES (NEW.user_id, 'hajj',
            'Hajj booking updated',
            'Your Hajj booking status is now ' || NEW.status::text || '.',
            '/hajj',
            jsonb_build_object('booking_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_hajj_insert
AFTER INSERT ON public.hajj_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_hajj_booking();

CREATE TRIGGER trg_notify_hajj_update
AFTER UPDATE ON public.hajj_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_hajj_booking();
