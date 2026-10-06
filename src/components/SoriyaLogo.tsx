import React from 'react';

interface SoriyaLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'gradient' | 'monochrome' | 'white';
}

export const SoriyaLogo: React.FC<SoriyaLogoProps> = ({
  className = 'w-6 h-6',
  size,
  variant = 'gradient',
}) => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Soriya Voice Logo"
    >
      <defs>
        <linearGradient id="soriya-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="soriya-logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* 6 Vertical Rounded Bars matching exact logo proportion */}
      {/* Bar 1 */}
      <rect
        x="145"
        y="420"
        width="70"
        height="160"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />

      {/* Bar 2 */}
      <rect
        x="265"
        y="310"
        width="70"
        height="380"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />

      {/* Bar 3 */}
      <rect
        x="385"
        y="400"
        width="70"
        height="200"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />

      {/* Bar 4 (Center Tallest) */}
      <rect
        x="525"
        y="200"
        width="70"
        height="600"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />

      {/* Bar 5 */}
      <rect
        x="665"
        y="330"
        width="70"
        height="340"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />

      {/* Bar 6 */}
      <rect
        x="785"
        y="420"
        width="70"
        height="160"
        rx="35"
        fill={variant === 'gradient' ? 'url(#soriya-logo-grad)' : variant === 'white' ? '#FFFFFF' : 'currentColor'}
      />
    </svg>
  );
};
