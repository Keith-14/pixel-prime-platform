import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        {/* Hand holding tasbeeh animation */}
        <div className="w-64 h-64 mx-auto mb-6 relative">
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full"
          >
            {/* Tasbeeh string */}
            <ellipse 
              cx="100" 
              cy="85" 
              rx="55" 
              ry="45" 
              fill="none" 
              stroke="rgba(180, 160, 130, 0.4)" 
              strokeWidth="2"
            />
            
            {/* Tasbeeh beads - animated counting effect */}
            {[...Array(16)].map((_, i) => {
              const angle = (i * 22.5) - 90; // Distribute beads around ellipse
              const rx = 55;
              const ry = 45;
              const x = 100 + rx * Math.cos((angle * Math.PI) / 180);
              const y = 85 + ry * Math.sin((angle * Math.PI) / 180);
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={6}
                  fill="rgba(180, 160, 130, 0.9)"
                  className="bead-glow"
                  style={{
                    animation: `beadPulse 2s ease-in-out infinite`,
                    animationDelay: `${i * 0.125}s`,
                  }}
                />
              );
            })}
            
            {/* Tassel */}
            <line x1="100" y1="130" x2="100" y2="155" stroke="rgba(180, 160, 130, 0.6)" strokeWidth="2" />
            <circle cx="100" cy="160" r="5" fill="rgba(180, 160, 130, 0.8)" />
            <circle cx="100" cy="172" r="4" fill="rgba(180, 160, 130, 0.7)" />
            <circle cx="100" cy="182" r="3" fill="rgba(180, 160, 130, 0.6)" />
            
            {/* Hand silhouette - thumb on left */}
            <g className="hand-counting">
              {/* Palm */}
              <path
                d="M75 110 
                   Q65 105 60 95
                   Q55 85 62 75
                   L68 78
                   Q64 85 66 92
                   Q68 98 75 102
                   Z"
                fill="rgba(139, 115, 85, 0.85)"
                className="thumb"
              />
              
              {/* Main hand/fingers holding beads */}
              <path
                d="M120 75
                   Q135 80 140 95
                   Q145 110 135 125
                   L125 120
                   Q132 108 130 95
                   Q128 85 118 80
                   Z"
                fill="rgba(139, 115, 85, 0.85)"
              />
              
              {/* Index finger - moving */}
              <path
                d="M115 60
                   Q125 55 135 58
                   Q145 62 148 75
                   Q150 85 145 90
                   L138 85
                   Q142 78 140 70
                   Q138 62 130 60
                   Q122 58 118 62
                   Z"
                fill="rgba(139, 115, 85, 0.9)"
                style={{
                  transformOrigin: '130px 75px',
                  animation: 'fingerMove 1s ease-in-out infinite',
                }}
              />
              
              {/* Thumb pushing bead */}
              <ellipse
                cx="72"
                cy="88"
                rx="12"
                ry="8"
                fill="rgba(139, 115, 85, 0.9)"
                style={{
                  transformOrigin: '72px 88px',
                  animation: 'thumbPush 1s ease-in-out infinite',
                }}
              />
            </g>
            
            {/* Highlight bead being counted */}
            <circle
              cx="45"
              cy="85"
              r="7"
              fill="rgba(200, 180, 140, 1)"
              style={{
                animation: 'activeBead 1s ease-in-out infinite',
              }}
            />
          </svg>
        </div>
        
        <h1 className="text-5xl font-arabic font-bold text-[#c9b896] mb-3 tracking-wide">BARAKAH</h1>
        <p className="text-sm text-[#a89a7d] font-body tracking-[0.3em]">
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
        @keyframes beadPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        
        @keyframes fingerMove {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-8deg);
          }
        }
        
        @keyframes thumbPush {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        
        @keyframes activeBead {
          0%, 100% {
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 4px rgba(200, 180, 140, 0.5));
          }
          50% {
            transform: translateY(-3px) scale(1.1);
            filter: drop-shadow(0 0 8px rgba(200, 180, 140, 0.8));
          }
        }
        
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
        
        .bead-glow {
          filter: drop-shadow(0 0 3px rgba(180, 160, 130, 0.4));
        }
        
        .hand-counting {
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
        }
      `}</style>
    </div>
  );
};
