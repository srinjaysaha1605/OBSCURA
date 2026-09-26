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

          {/* SVG Sigil matching reference design */}
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-500"
          >
            <defs>
              {/* Filter for ink brush texture & jitter */}
              <filter id="ink-texture" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            {/* Main Organic Circle (Rough Brush Stroke Ring) */}
            <circle
              cx="100"
              cy="105"
              r="48"
              stroke="#E5E5E5"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#ink-texture)"
              className="transition-all duration-500 group-hover:stroke-white"
            />
            {/* Secondary thin inner contour for ink depth */}
            <circle
              cx="100"
              cy="105"
              r="46.5"
              stroke="#A3A3A3"
              strokeWidth="1.2"
              fill="none"
              opacity="0.6"
              filter="url(#ink-texture)"
            />

            {/* Diagonal Slash Stroke (Bottom-Left to Top-Right) */}
            <path
              d="M 52 162 L 138 52"
              stroke="#F5F5F5"
              strokeWidth="14"
              strokeLinecap="round"
              filter="url(#ink-texture)"
              className="transition-all duration-500 group-hover:stroke-white"
            />
            {/* Dark core line inside slash for brush density */}
            <path
              d="M 58 156 L 134 58"
              stroke="#080808"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#ink-texture)"
              opacity="0.75"
            />

            {/* Dither / Halftone Dots Array dissolving upwards right */}
            <g className={`transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-1 -translate-y-1' : 'opacity-85'}`}>
              {/* Row 1 - dense near brush tip */}
              <circle cx="137" cy="53" r="2.2" fill="#E5E5E5" />
              <circle cx="142" cy="47" r="2.0" fill="#E5E5E5" />
              <circle cx="145" cy="51" r="1.8" fill="#E5E5E5" />
              <circle cx="148" cy="43" r="1.8" fill="#E5E5E5" />

              {/* Row 2 - medium dispersion */}
              <circle cx="151" cy="40" r="1.6" fill="#D4D4D4" />
              <circle cx="155" cy="44" r="1.5" fill="#D4D4D4" />
              <circle cx="154" cy="35" r="1.5" fill="#D4D4D4" />
              <circle cx="160" cy="38" r="1.4" fill="#D4D4D4" />
              <circle cx="159" cy="30" r="1.3" fill="#D4D4D4" />

              {/* Row 3 - fine stippling spray */}
              <circle cx="165" cy="33" r="1.2" fill="#A3A3A3" />
              <circle cx="168" cy="27" r="1.2" fill="#A3A3A3" />
              <circle cx="171" cy="30" r="1.0" fill="#A3A3A3" />
              <circle cx="174" cy="24" r="1.0" fill="#A3A3A3" />
              <circle cx="178" cy="22" r="0.9" fill="#737373" />
              <circle cx="182" cy="18" r="0.8" fill="#737373" />
              <circle cx="186" cy="15" r="0.7" fill="#525252" />
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
