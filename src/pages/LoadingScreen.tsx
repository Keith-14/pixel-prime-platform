import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoadingScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#fbf1dd' }}>
      {/* Centered animated logo */}
      <img
        src="https://ik.imagekit.io/i9qun1svg/30%20fps%20.gif"
        alt="Barakah"
        className="w-40 h-40 object-contain relative z-10"
      />

      {/* Bottom dune + palms */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="duneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd9a4" />
            <stop offset="100%" stopColor="#f4c27a" />
          </linearGradient>
        </defs>
        <path
          d="M0,110 C80,70 160,140 240,110 C320,80 360,120 400,100 L400,160 L0,160 Z"
          fill="url(#duneGrad)"
        />
      </svg>

      {/* Palm trees */}
      <PalmTree className="absolute bottom-8 left-6 w-14 h-20" />
      <PalmTree className="absolute bottom-10 left-16 w-10 h-14 opacity-80" />
      <PalmTree className="absolute bottom-10 right-10 w-16 h-24" />
    </div>
  );
};

const PalmTree = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 64 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Trunk */}
    <path
      d="M32 96 C30 70 34 50 32 30"
      stroke="#b87545"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Leaves */}
    <path d="M32 28 C20 22 10 24 4 30 C14 28 22 30 30 34 Z" fill="#c98a55" />
    <path d="M32 28 C44 22 54 24 60 30 C50 28 42 30 34 34 Z" fill="#b87545" />
    <path d="M32 28 C28 16 22 10 14 8 C22 16 26 22 30 30 Z" fill="#b87545" />
    <path d="M32 28 C36 16 42 10 50 8 C42 16 38 22 34 30 Z" fill="#c98a55" />
    <path d="M32 28 C30 18 30 10 32 2 C34 10 34 18 32 28 Z" fill="#a86537" />
  </svg>
);
