import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Prefs = Record<string, boolean>;

const CATEGORIES: { key: string; label: string; description: string }[] = [
  { key: 'prayer', label: 'Prayer Times', description: 'Adhan reminders for the 5 daily prayers' },
  { key: 'marketplace', label: 'Marketplace', description: 'Orders, shipping updates, seller notifications' },
  { key: 'community', label: 'Guftagu Community', description: 'Replies and likes on your posts' },
  { key: 'news', label: 'Islamic News', description: 'Curated news alerts' },
  { key: 'hajj', label: 'Hajj', description: 'Booking status and travel updates' },
  { key: 'ai', label: 'AI Assistant', description: 'Replies from Barakah AI' },
  { key: 'system', label: 'System', description: 'App updates and important announcements' },
];

const CHANNELS = ['in_app', 'push', 'email'] as const;
const CHANNEL_LABELS: Record<string, string> = { in_app: 'In-app', push: 'Push', email: 'Email' };

export const NotificationSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const flat: Prefs = {};
        Object.entries(data).forEach(([k, v]) => { if (typeof v === 'boolean') flat[k] = v; });
        setPrefs(flat);
      } else {
        // seed defaults locally
        const seeded: Prefs = {};
        CATEGORIES.forEach(({ key }) => CHANNELS.forEach((c) => { seeded[`${key}_${c}`] = c !== 'email'; }));
        setPrefs(seeded);
      }
      setLoading(false);
    })();
  }, [user]);

  const toggle = async (field: string) => {
    if (!user) return;
    const next = { ...prefs, [field]: !prefs[field] };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) toast.error('Could not save. Please try again.');
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24" style={{ backgroundColor: '#FFF1DD' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ backgroundColor: '#FFF1DD' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-semibold" style={{ color: '#3A1E12', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Notification Settings
        </h1>
        {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
      </header>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
      ) : (
        <div className="px-4 space-y-4">
          {CATEGORIES.map(({ key, label, description }) => (
            <div key={key} className="rounded-2xl p-4 bg-white shadow-sm">
              <p className="font-semibold text-sm" style={{ color: '#3A1E12' }}>{label}</p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: '#6b4a35' }}>{description}</p>
              <div className="space-y-2">
                {CHANNELS.map((ch) => {
                  const field = `${key}_${ch}`;
                  return (
                    <div key={ch} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#3A1E12' }}>{CHANNEL_LABELS[ch]}</span>
                      <Switch checked={!!prefs[field]} onCheckedChange={() => toggle(field)} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
