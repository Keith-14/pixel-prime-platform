import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_LABEL: Record<string, string> = {
  prayer: 'Prayer',
  marketplace_buyer: 'Order',
  marketplace_seller: 'Sales',
  community: 'Community',
  news: 'News',
  hajj: 'Hajj',
  ai: 'AI',
  system: 'System',
};

export const Notifications = () => {
  const navigate = useNavigate();
  const { items, loading, unreadCount, markRead, markAllRead, remove } = useNotifications();

  const handleOpen = async (n: AppNotification) => {
    if (!n.is_read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto pb-24" style={{ backgroundColor: '#FFF1DD' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ backgroundColor: '#FFF1DD' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-semibold" style={{ color: '#3A1E12', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Notifications
        </h1>
        <Button variant="ghost" size="icon" onClick={() => navigate('/notifications/settings')} className="rounded-xl">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {unreadCount > 0 && (
        <div className="px-4 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-xs h-8"
            style={{ color: '#A35233' }}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Mark all as read
          </Button>
        </div>
      )}

      <div className="px-4 space-y-2">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: '#78351A' }}>No notifications yet</p>
            <p className="text-xs mt-1 text-muted-foreground">You'll see prayer reminders, orders and community activity here.</p>
          </div>
        )}
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => handleOpen(n)}
            className="rounded-2xl p-4 shadow-sm cursor-pointer transition-all"
            style={{
              backgroundColor: n.is_read ? '#FFFFFF' : '#FDE7CE',
              borderLeft: n.is_read ? 'none' : '4px solid #B54A22',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: '#A35233' }}>
                    {CATEGORY_LABEL[n.category] ?? n.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="font-semibold text-sm" style={{ color: '#3A1E12' }}>{n.title}</p>
                {n.body && <p className="text-xs mt-1" style={{ color: '#6b4a35' }}>{n.body}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
