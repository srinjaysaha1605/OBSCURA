import React, { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Background animated dither noise & ink particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create dither noise grid & particles
    interface DitherDot {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }

    const particles: DitherDot[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.7 ? 1 : 2,
      speed: 0.1 + Math.random() * 0.3,
      opacity: 0.15 + Math.random() * 0.4
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Render subtle background dither grid pattern
      const gridSize = 12;
      const cols = Math.ceil(width / gridSize);
      const rows = Math.ceil(height / gridSize);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < cols; i += 2) {
        for (let j = 0; j < rows; j += 2) {
          // Bayer-like matrix offset
          const threshold = (i * 3 + j * 7) % 10;
          if (threshold < 2) {
            ctx.fillRect(i * gridSize, j * gridSize, 1, 1);
          }
        }
      }

      // Render floating dither particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        const alpha = p.opacity * (0.8 + 0.2 * Math.sin(time + p.x));
        ctx.fillStyle = `rgba(240, 240, 240, ${alpha})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSigilClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#080808] text-neutral-100 select-none transition-opacity duration-700 ease-in-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Dither Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Centered Container: Sigil Button + Quote Below */}
      <main className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center gap-8 w-full max-w-xl px-6">
        <button
          onClick={handleSigilClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative group focus:outline-none cursor-pointer p-2 transition-transform duration-500 hover:scale-105 active:scale-95"
          aria-label="Enter Obscura Exhibition"
        >
          {/* Outer glow ring on hover */}
          <div
            className={`absolute inset-0 rounded-full transition-opacity duration-500 filter blur-xl ${
              isHovered ? 'bg-white/10 opacity-100' : 'opacity-0'
            }`}
          />

          {/* SVG Sigil matching user uploaded graphic */}
          <svg
            width="220"
            height="220"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-500 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]"
          >
            <defs>
              {/* Halftone / Dither Dot Pattern */}
              <pattern id="sigil-dither" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.8" fill="#FFFFFF" />
              </pattern>

              {/* Ink brush noise texture filter */}
              <filter id="sigil-brush-noise" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.8" xChannelSelector="R" yChannelSelector="G" />
              </filter>

              <linearGradient id="needle-gradient" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="crescent-fade-left" x1="30" y1="100" x2="95" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#E5E5E5" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
              </linearGradient>

              <linearGradient id="crescent-fade-right" x1="170" y1="100" x2="105" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#E5E5E5" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Left Crescent Moon Arc */}
            <g filter="url(#sigil-brush-noise)">
              {/* Outer thick crescent brush shape */}
              <path
                d="M 96 36 C 45 42 22 88 32 122 C 40 148 68 165 92 164 C 60 152 42 125 45 92 C 48 65 72 45 96 36 Z"
                fill="url(#crescent-fade-left)"
              />
              {/* Dither halftone overlay */}
              <path
                d="M 96 36 C 45 42 22 88 32 122 C 40 148 68 165 92 164 C 60 152 42 125 45 92 C 48 65 72 45 96 36 Z"
                fill="url(#sigil-dither)"
                opacity="0.35"
              />
              {/* Inner bright crescent stroke */}
              <path
                d="M 90 40 C 50 48 30 85 38 118 C 45 142 70 158 88 158 C 62 146 48 122 50 92 C 52 68 70 50 90 40 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>

            {/* Right Crescent Moon Arc */}
            <g filter="url(#sigil-brush-noise)">
              {/* Outer thick crescent brush shape */}
              <path
                d="M 104 36 C 155 42 178 88 168 122 C 160 148 132 165 108 164 C 140 152 158 125 155 92 C 152 65 128 45 104 36 Z"
                fill="url(#crescent-fade-right)"
              />
              {/* Dither halftone overlay */}
              <path
                d="M 104 36 C 155 42 178 88 168 122 C 160 148 132 165 108 164 C 140 152 158 125 155 92 C 152 65 128 45 104 36 Z"
                fill="url(#sigil-dither)"
                opacity="0.35"
              />
              {/* Inner bright crescent stroke */}
              <path
                d="M 110 40 C 150 48 170 85 162 118 C 155 142 130 158 112 158 C 138 146 152 122 150 92 C 148 68 130 50 110 40 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>

            {/* Central Razor Needle / Spire */}
            <path
              d="M 100 10 L 104 100 L 100 190 L 96 100 Z"
              fill="url(#needle-gradient)"
              className="transition-all duration-500 group-hover:scale-y-105 origin-center"
            />
            <path
              d="M 100 10 L 102 100 L 100 190 L 98 100 Z"
              fill="#FFFFFF"
            />

            {/* Fine Dither Stipple Particles along outer curves */}
            <g opacity="0.75" className={`transition-all duration-500 ${isHovered ? 'scale-110' : ''} origin-center`}>
              <circle cx="30" cy="110" r="1.2" fill="#FFFFFF" />
              <circle cx="27" cy="118" r="0.9" fill="#E5E5E5" />
              <circle cx="34" cy="128" r="1.1" fill="#D4D4D4" />
              <circle cx="170" cy="110" r="1.2" fill="#FFFFFF" />
              <circle cx="173" cy="118" r="0.9" fill="#E5E5E5" />
              <circle cx="166" cy="128" r="1.1" fill="#D4D4D4" />
            </g>
          </svg>
        </button>

        {/* Quote Below Sigil */}
        <header className="text-center animate-gallery-fade">
          <div className="w-8 h-[1px] bg-neutral-800 mx-auto mb-4" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-serif-display text-neutral-300 italic tracking-wide leading-relaxed">
            Obscura - L’image se révèle à l’encre.
          </h1>
        </header>
      </main>
    </div>
  );
};
