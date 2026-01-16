import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tasbeehImage from '@/assets/tasbeeh-startup.png';

export const LoadingScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 4 seconds to give time for animation
    const timer = setTimeout(() => {
      navigate('/login');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center max-w-md mx-auto relative overflow-hidden">
      {/* Dark sage gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(180deg, rgba(40, 55, 45, 1) 0%, rgba(25, 35, 28, 1) 50%, rgba(15, 20, 16, 1) 100%)' 
          }}
        />
        <div 
          className="absolute inset-0"
          style={{ background: 'rgba(106, 139, 116, 0.08)' }}
        />
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%]"
          style={{ 
            background: 'radial-gradient(ellipse at top, rgba(106, 139, 116, 0.15) 0%, transparent 70%)' 
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Tasbeeh Image */}
        <div className="w-64 h-64 mx-auto mb-6 relative flex items-center justify-center">
          <img 
            src={tasbeehImage} 
            alt="Hand holding tasbeeh" 
            className="w-full h-full object-contain animate-pulse-slow"
          />
        </div>
        
        <h1 className="text-5xl font-arabic font-bold text-[#ffebc9] mb-3 tracking-wide">BARAKAH</h1>
        <p className="text-sm text-[#ffebc9]/70 font-body tracking-[0.3em]">
          FAITH • LIFESTYLE • COMMUNITY
        </p>

        {/* Loading dots */}
        <div className="mt-10 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#6a8b74]"
              style={{
                animation: 'loadingDot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        
        @keyframes pulseSlow {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};
