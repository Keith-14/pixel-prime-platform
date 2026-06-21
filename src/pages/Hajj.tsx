import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import hajjImage from '@/assets/hajj-coming-soon-user.png.asset.json';

const CREAM = '#FFF8F0';
const BROWN_ACCENT = '#A35233';

export const Hajj = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden font-arabic flex flex-col"
      style={{ background: CREAM }}
    >
      {/* Image only */}
      <div className="flex-1 flex items-center justify-center px-6">
        <img
          src={hajjImage.url}
          alt="Hajj and Umrah coming soon"
          className="w-full max-w-[380px] h-auto object-contain"
        />
      </div>

      {/* Bottom Button */}
      <div className="px-6 pb-28">
        <button
          onClick={() => navigate('/prayer-times')}
          className="w-full py-4 rounded-full text-[16px] font-semibold text-white transition-transform active:scale-95"
          style={{
            background: BROWN_ACCENT,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Explore Prayer
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};
