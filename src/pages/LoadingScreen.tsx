import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoadingScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center max-w-md mx-auto relative overflow-hidden">
      {/* Islamic pattern background - more prominent for loading screen */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8A082' fill-opacity='0.6'%3E%3Cpath d='M50 50c0-27.614-22.386-50-50-50v50h50zM0 50v50h50c0-27.614-22.386-50-50-50z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />
        {/* Additional decorative Islamic geometric pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236B8E7A' fill-opacity='0.2'%3E%3Cpath d='M30 60c16.569 0 30-13.431 30-30s-13.431-30-30-30-30 13.431-30 30 13.431 30 30 30zm30 0c16.569 0 30-13.431 30-30s-13.431-30-30-30-30 13.431-30 30 13.431 30 30 30z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        />
      </div>

      {/* Islamic dome/arch silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Main dome shape */}
          <svg 
            width="350" 
            height="500" 
            viewBox="0 0 350 500" 
            className="text-sage/60"
            style={{
              filter: 'drop-shadow(0 10px 30px rgba(107, 142, 122, 0.3))'
            }}
          >
            {/* Islamic arch/dome silhouette */}
            <path 
              d="M50 450 L50 200 Q50 50 175 50 Q300 50 300 200 L300 450 Z" 
              fill="currentColor" 
              fillOpacity="0.8"
            />
            {/* Decorative arch details */}
            <path 
              d="M70 430 L70 200 Q70 70 175 70 Q280 70 280 200 L280 430" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeOpacity="0.6"
            />
            <path 
              d="M90 410 L90 200 Q90 90 175 90 Q260 90 260 200 L260 410" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeOpacity="0.4"
            />
          </svg>
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 text-center">
        {/* Prayer beads icon - larger for splash screen */}
        <div className="w-32 h-32 mx-auto mb-8 flex items-center justify-center">
          <svg width="100" height="120" viewBox="0 0 100 120" className="text-cream animate-pulse">
            {/* Prayer beads circle with enhanced design */}
            <g fill="currentColor">
              {/* Top bead */}
              <circle cx="50" cy="10" r="7" />
              {/* Main circle of beads - larger */}
              <circle cx="75" cy="30" r="6" />
              <circle cx="85" cy="55" r="6" />
              <circle cx="75" cy="80" r="6" />
              <circle cx="50" cy="92" r="6" />
              <circle cx="25" cy="80" r="6" />
              <circle cx="15" cy="55" r="6" />
              <circle cx="25" cy="30" r="6" />
              <circle cx="50" cy="18" r="6" />
              {/* Inner circle beads */}
              <circle cx="57" cy="25" r="5" />
              <circle cx="65" cy="38" r="5" />
              <circle cx="65" cy="52" r="5" />
              <circle cx="65" cy="66" r="5" />
              <circle cx="57" cy="78" r="5" />
              <circle cx="43" cy="78" r="5" />
              <circle cx="35" cy="66" r="5" />
              <circle cx="35" cy="52" r="5" />
              <circle cx="35" cy="38" r="5" />
              <circle cx="43" cy="25" r="5" />
              {/* Hanging tassel beads */}
              <circle cx="50" cy="105" r="5" />
              <circle cx="50" cy="114" r="4" />
            </g>
          </svg>
        </div>
        
        <h1 className="text-5xl font-bold text-sage mb-3">BARAKAH</h1>
        <p className="text-base text-sage/90 font-medium tracking-widest">
          FAITH. LIFESTYLE. COMMUNITY.
        </p>

        {/* Loading indicator */}
        <div className="mt-12">
          <div className="w-16 h-1 bg-sage/30 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-sage rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};