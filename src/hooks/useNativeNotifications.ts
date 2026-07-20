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
 * Pass the times in "HH:MM" 24-hour format. No-op on web.
 */
export const schedulePrayerReminders = async (
  times: Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>
) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    // Cancel any previously scheduled prayer reminders (ids 1..5).
    try {
      await LocalNotifications.cancel({ notifications: [1, 2, 3, 4, 5].map((id) => ({ id })) });
    } catch {}

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
    const now = new Date();

    const notifications = prayers.map((name, idx) => {
      const [h, m] = (times[name] || '00:00').split(':').map(Number);
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
      return {
        id: idx + 1,
        title: `${name} time`,
        body: `It's time for ${name} prayer.`,
        schedule: { at, repeats: true, every: 'day' as const, allowWhileIdle: true },
        smallIcon: 'ic_launcher',
        channelId: 'prayer',
      };
    });

    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.warn('Local prayer reminders unavailable', e);
  }
};
