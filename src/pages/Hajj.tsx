import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import hajjIllustration from '@/assets/hajj-coming-soon-v2.png.asset.json';

const CREAM = '#FFF8F0';
const WHITE = '#FFFFFF';
const BROWN = '#2C1309';
const BROWN_ACCENT = '#A35233';
const OLIVE = '#7C7E2D';
const BROWN_MUTED = '#8B6F5C';
const BORDER = '#E8D5C4';

export const Hajj = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden font-arabic flex flex-col"
      style={{ background: CREAM }}
    >
      {/* Header — white with bottom border */}
      <div
        className="flex items-center justify-between px-5 pt-4 pb-3"
        style={{
          background: WHITE,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
          style={{ color: BROWN_ACCENT }}
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1
          className="text-[18px] font-bold"
          style={{
            color: BROWN_ACCENT,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Hajj & Umrah
        </h1>
        <button
          className="p-2 -mr-2"
          style={{ color: BROWN_ACCENT }}
          aria-label="Search"
        >
          <Search className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-8">
        {/* Illustration */}
        <div className="w-full max-w-[340px] mb-10">
          <img
            src={hajjIllustration.url}
            alt="Hajj and Umrah illustration"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Heading */}
        <h2
          className="text-[32px] font-bold text-center leading-tight"
          style={{
            color: BROWN,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Your sacred journey,
        </h2>
        <h2
          className="text-[32px] font-bold text-center leading-tight mt-1"
          style={{
            color: OLIVE,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Coming soon
        </h2>

        {/* Subtitle */}
        <p
          className="text-[15px] text-center mt-5 leading-relaxed max-w-[300px]"
          style={{ color: BROWN_MUTED }}
        >
          We're building trusted Hajj and Umrah packages with verified operators, transparent pricing.
        </p>
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
