import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationBell = ({ buttonClassName }: { buttonClassName?: string }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate('/notifications')}
      className={cn(
        'relative hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/25 transition-all duration-300',
        buttonClassName || 'text-foreground'
      )}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" strokeWidth={1.5} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: '#B54A22' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
};
