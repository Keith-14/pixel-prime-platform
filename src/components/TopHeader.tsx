import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) {
        setUserName('');
        return;
      }

      // Try to get name from user metadata first
      const metaName = user.user_metadata?.full_name;
      if (metaName) {
        setUserName(metaName.split(' ')[0]); // First name only
        return;
      }

      // Fallback to profiles table
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0]);
      }
    };

    fetchUserName();
  }, [user]);

  const greeting = userName ? `As-Salaam-Alaikum, ${userName}` : 'As-Salaam-Alaikum';

  return (
    <header className="relative z-20 bg-sage text-primary-foreground px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary-foreground hover:bg-white/20"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-medium">{greeting}</span>
      </div>
      
      <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
};
