import fs from 'fs';
import path from 'path';

// Create a high-res 1024x1024 SVG for the macOS App Icon
const svgContent = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1e1b4b" />
      <stop offset="50%" stopColor="#0f172a" />
      <stop offset="100%" stopColor="#020617" />
    </linearGradient>
    <linearGradient id="wave-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#6366f1" />
      <stop offset="50%" stopColor="#818cf8" />
      <stop offset="100%" stopColor="#38bdf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- macOS App Squircle Background -->
  <rect x="64" y="64" width="896" height="896" rx="200" fill="url(#bg-grad)" filter="url(#shadow)" stroke="#312e81" stroke-width="6" />

  <!-- Subtle inner border highlight -->
  <rect x="67" y="67" width="890" height="890" rx="197" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />

  <!-- Centered Audio Waveform Group -->
  <g transform="translate(100, 100) scale(0.82)" filter="url(#glow)">
    <!-- Bar 1 -->
    <rect x="145" y="420" width="70" height="160" rx="35" fill="url(#wave-grad)" />

    <!-- Bar 2 -->
    <rect x="265" y="310" width="70" height="380" rx="35" fill="url(#wave-grad)" />

    <!-- Bar 3 -->
    <rect x="385" y="400" width="70" height="200" rx="35" fill="url(#wave-grad)" />

    <!-- Bar 4 (Center) -->
    <rect x="525" y="200" width="70" height="600" rx="35" fill="url(#wave-grad)" />

    <!-- Bar 5 -->
    <rect x="665" y="330" width="70" height="340" rx="35" fill="url(#wave-grad)" />

    <!-- Bar 6 -->
    <rect x="785" y="420" width="70" height="160" rx="35" fill="url(#wave-grad)" />
  </g>
</svg>`;

const outDir = path.resolve('build');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgContent, 'utf8');
console.log('Generated build/icon.svg');
