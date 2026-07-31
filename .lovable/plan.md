## Notification System — Full Rollout

Deliver a unified notification pipeline across in-app, native push, and email — governed by per-user, per-category preferences.

### 1. Database (Lovable Cloud)

New tables (all with RLS, GRANTs, RLS scoped to `auth.uid()`):

- `notifications` — `id, user_id, category, title, body, data (jsonb), link, is_read, created_at`. Realtime-enabled.
- `notification_preferences` — one row per user; boolean columns per category × channel (in_app / push / email). Auto-created on first read via upsert.
- `push_tokens` — `id, user_id, token, platform (ios|android|web), device_id, updated_at`. Unique on (user_id, token).

Categories: `prayer`, `marketplace_buyer`, `marketplace_seller`, `community`, `news`, `hajj`, `ai`, `system`.

### 2. In-App Notifications (bell + feed)

- New `NotificationBell` component in `TopHeader` with unread badge, subscribed to Realtime on `notifications`.
- New `/notifications` page listing the feed, grouped by day, with mark-as-read + mark-all-read.
- Toast (Sonner) auto-fires when a new row arrives while app is foregrounded.
- New `/settings/notifications` page with per-category × channel toggles bound to `notification_preferences`.

### 3. Native Push (Android + iOS)

- Install `@capacitor/push-notifications` and `@capacitor/local-notifications`.
- On login (native only): request permission → register → save FCM token to `push_tokens`.
- Listen for foreground pushes → route to `/notifications`.
- iOS needs APNs auth key uploaded to Firebase; Android needs `google-services.json`. These require **user action** — I'll document the exact steps and add placeholder wiring so the native build compiles.
- Push delivery is driven by an edge function `dispatch-push` that reads recipient tokens and posts to FCM HTTP v1 using `FCM_SERVICE_ACCOUNT_JSON` (I'll request this via `add_secret` after your Firebase setup).

### 4. Email Notifications

- Use Lovable's built-in transactional email (`send-transactional-email`) — no third-party service.
- Requires a verified sender domain. I'll open the email-setup dialog on your side and scaffold the transactional function after the domain is configured.
- Email templates: order updates, seller new order, community reply, Hajj booking status, news digest (opt-in).

### 5. Prayer Reminders (local, no server needed)

- Use `@capacitor/local-notifications` to schedule the 5 daily adhan reminders on-device from the computed prayer times (already available in `PrayerTimes.tsx`).
- Reschedules on login, on location change, and daily at midnight.
- Per-prayer on/off toggles under the `prayer` category.

### 6. Central Dispatcher

Single edge function `notify` that:
1. Reads recipient's `notification_preferences`.
2. Inserts into `notifications` when `in_app` is on.
3. Calls `dispatch-push` when `push` is on and tokens exist.
4. Calls `send-transactional-email` when `email` is on.

Called from:
- `orders` / `order_items` insert & status update (DB trigger → `pg_net` → `notify`).
- `guftagu_replies` and `guftagu_likes` insert (DB trigger).
- `hajj_bookings` status change (DB trigger).
- `news_articles` insert (optional daily digest via cron).
- `chat_messages` when AI reply arrives (edge function calls `notify` at the end of `chat`).

### 7. Technical Details

- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`
- Triggers use `pg_net.http_post` to the `notify` function with the project anon key (stored via `insert` tool, not migration, so remixes stay clean).
- All edge functions include CORS, JWT validation, and Zod input validation.
- Client uses a `useNotifications` hook that manages Realtime subscription, unread counts, and preference reads/writes.

### 8. What You Need To Provide (after this plan)

1. **FCM setup:** Create a Firebase project (or reuse your existing one), enable Cloud Messaging, download `google-services.json` (Android) and generate an APNs auth key uploaded to Firebase Cloud Messaging (iOS). Then paste the FCM service-account JSON when I request it.
2. **Email sender domain:** Complete the email-setup dialog I'll open (any domain you own).
3. Run `npx cap sync` + rebuild native apps after the Capacitor plugin installs.

### Rollout Order

1. Database + RLS + Realtime.
2. In-app bell, feed, settings page.
3. `notify` edge function + DB triggers for orders, community, Hajj.
4. Local prayer notifications.
5. Native push wiring (Capacitor plugins + `dispatch-push`) — awaits FCM creds.
6. Transactional emails — awaits domain.

Confirm to proceed, or tell me which sections to trim.