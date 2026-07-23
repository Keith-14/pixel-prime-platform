import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Registers native push notifications (FCM/APNs) and stores the token in
 * `push_tokens`. No-op on web. Safe to call even when native plugins are
 * unavailable because everything is wrapped in try/catch.
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
        console.warn('Push notifications unavailable', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
};

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
export interface PrayerOccurrence {
  name: PrayerName;
  at: Date;
}

/**
 * Schedule one notification 5 minutes before each prayer and another exactly
 * at prayer time. These are one-shot local notifications because prayer times
 * shift each day; callers should reschedule when fresh times are available.
 */
export const schedulePrayerReminders = async (occurrences: PrayerOccurrence[]) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    try {
      await LocalNotifications.createChannel({
        id: 'prayer',
        name: 'Prayer reminders',
        description: 'Prayer time and pre-prayer reminders',
        importance: 5,
        visibility: 1,
        sound: 'default',
      });
    } catch {}

    try {
      const ids = Array.from({ length: 80 }, (_, i) => i + 1);
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    } catch {}

    const now = Date.now();
    const notifications = occurrences
      .filter((o) => o.at.getTime() > now)
      .slice(0, 40)
      .flatMap((o, idx) => {
        const before = new Date(o.at.getTime() - 5 * 60 * 1000);
        return [
          {
            id: idx * 2 + 1,
            title: `${o.name} in 5 minutes`,
            body: `Get ready for ${o.name} prayer.`,
            schedule: { at: before, allowWhileIdle: true },
            smallIcon: 'ic_launcher',
            channelId: 'prayer',
          },
          {
            id: idx * 2 + 2,
            title: `${o.name} time`,
            body: `It's time for ${o.name} prayer.`,
            schedule: { at: o.at, allowWhileIdle: true },
            smallIcon: 'ic_launcher',
            channelId: 'prayer',
          },
        ].filter((n) => n.schedule.at.getTime() > now);
      });

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (e) {
    console.warn('Local prayer reminders unavailable', e);
  }
};
