interface BarakahLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BarakahLogo = ({ className = '', size = 'md' }: BarakahLogoProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 80 100" className="w-full h-full text-primary">
        {/* Prayer beads circle with glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g fill="currentColor" filter="url(#glow)">
          {/* Top bead */}
          <circle cx="40" cy="8" r="6" />
          {/* Main circle of beads */}
          <circle cx="60" cy="25" r="5" />
          <circle cx="68" cy="45" r="5" />
          <circle cx="60" cy="65" r="5" />
          <circle cx="40" cy="75" r="5" />
          <circle cx="20" cy="65" r="5" />
          <circle cx="12" cy="45" r="5" />
          <circle cx="20" cy="25" r="5" />
          <circle cx="40" cy="15" r="5" />
          <circle cx="45" cy="20" r="4" />
          <circle cx="50" cy="30" r="4" />
          <circle cx="50" cy="40" r="4" />
          <circle cx="50" cy="50" r="4" />
          <circle cx="45" cy="60" r="4" />
          <circle cx="35" cy="60" r="4" />
          <circle cx="30" cy="50" r="4" />
          <circle cx="30" cy="40" r="4" />
          <circle cx="30" cy="30" r="4" />
          <circle cx="35" cy="20" r="4" />
          {/* Hanging tassel bead */}
          <circle cx="40" cy="85" r="4" />
          <circle cx="40" cy="92" r="3" />
        </g>
      </svg>
    </div>
  );
};
