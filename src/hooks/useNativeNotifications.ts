import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Registers native push notifications (FCM/APNs) and stores the token in
 * `push_tokens`. No-op on web. Safe to call even when native plugins are
 * unavailable — everything is wrapped in try/catch.
 */
export const useNativePushRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    let cancelled = false;

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;
        if (status !== 'granted') {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }
        if (status !== 'granted') return;

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (t) => {
          if (cancelled) return;
          const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
          try {
            await supabase.from('push_tokens').upsert(
              { user_id: user.id, token: t.value, platform },
              { onConflict: 'user_id,token' }
            );
          } catch (e) {
            console.warn('push token save failed', e);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.warn('Push registration error', err);
        });
      } catch (e) {
        // Plugin not installed on this native shell — silently skip.
        console.warn('Push notifications unavailable', e);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);
};

/**
 * Schedule the 5 daily prayer reminders as local notifications on-device.
 * Accepts an array of concrete Date objects (one per prayer occurrence) so
 * caller can pass real, location-based times that shift day-to-day. No-op on web.
 */
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export interface PrayerOccurrence { name: PrayerName; at: Date; }

export const schedulePrayerReminders = async (occurrences: PrayerOccurrence[]) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    // Cancel any previously scheduled prayer reminders (ids 1..20 cover ~4 days).
    try {
      const ids = Array.from({ length: 20 }, (_, i) => i + 1);
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch {}

    const now = Date.now();
    const notifications = occurrences
      .filter((o) => o.at.getTime() > now)
      .slice(0, 20)
      .map((o, idx) => ({
        id: idx + 1,
        title: `${o.name} time`,
        body: `It's time for ${o.name} prayer.`,
        // One-shot at the exact computed instant — no daily repeat, because
        // prayer times shift each day. Re-scheduled daily by the caller.
        schedule: { at: o.at, allowWhileIdle: true },
        smallIcon: 'ic_launcher',
        channelId: 'prayer',
      }));

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (e) {
    console.warn('Local prayer reminders unavailable', e);
  }
};
