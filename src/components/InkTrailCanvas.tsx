import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  time: number;
  vx: number;
  vy: number;
  speed: number;
}

interface InkFleck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number; // 0 to 1
  maxLife: number; // ms
  color: string;
}

interface InkTrailCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}

export const InkTrailCanvas: React.FC<InkTrailCanvasProps> = ({ containerRef, enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const flecksRef = useRef<InkFleck[]>([]);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check reduced motion & touch capability
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touchQuery = window.matchMedia('(pointer: coarse)');

    setIsReducedMotion(motionQuery.matches);
    setIsTouchDevice(touchQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    const handleTouchChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    touchQuery.addEventListener('change', handleTouchChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      touchQuery.removeEventListener('change', handleTouchChange);
    };
  }, []);

  // Sync Canvas dimensions with Container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Main Canvas Animation Loop
  useEffect(() => {
    if (!enabled || isReducedMotion || isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TRAIL_LIFESPAN = 900; // ms trail duration before completely fading
    const FLECK_LIFESPAN = 600; // ms fleck particle lifetime

    const render = (now: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || canvas.width;
      const height = rect?.height || canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Filter out expired points
      pointsRef.current = pointsRef.current.filter(
        (p) => now - p.time < TRAIL_LIFESPAN
      );

      // Filter & update flecks
      flecksRef.current = flecksRef.current.filter((f) => {
        const age = now - f.life;
        if (age >= f.maxLife) return false;

        // Physics update
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.94; // friction
        f.vy *= 0.94;
        f.vy += 0.03; // subtle downward gravity

        const lifeRatio = 1 - age / f.maxLife;
        const opacity = Math.max(0, lifeRatio);

        // Draw fleck
        ctx.save();
        ctx.fillStyle = f.color.replace('OPA', opacity.toFixed(2));
        ctx.fillRect(f.x, f.y, f.size, f.size);
        ctx.restore();

        return true;
      });

      const points = pointsRef.current;

      if (points.length > 1) {
        ctx.save();

        // Draw smooth ribbon segments with Catmull-Rom or Bezier interpolation
        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const age = now - p2.time;
          const lifeRatio = Math.max(0, 1 - age / TRAIL_LIFESPAN);

          // Calculate speed-based stroke width
          // Slower speed = thicker ink mark (e.g. 14px), faster = thinner swift line (e.g. 4px)
          const baseWidth = Math.max(2.5, Math.min(16, 16 - p2.speed * 4.5));
          const strokeWidth = baseWidth * lifeRatio;

          const opacity = Math.pow(lifeRatio, 1.2);

          // Alternating paper-ink tone: stark white, light silver, charcoal
          const shade = i % 3 === 0 ? '255, 255, 255' : i % 2 === 0 ? '220, 220, 220' : '180, 180, 180';

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);

          if (i < points.length - 1) {
            // Smooth curve to midpoint
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          } else {
            ctx.lineTo(p2.x, p2.y);
          }

          ctx.strokeStyle = `rgba(${shade}, ${opacity.toFixed(2)})`;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Draw broken dither grain / rough edge stipple dots along the stroke
          if (lifeRatio > 0.15) {
            const numDots = Math.floor(strokeWidth * 0.8);
            for (let d = 0; d < numDots; d++) {
              const offsetX = (Math.random() - 0.5) * (strokeWidth * 1.4);
              const offsetY = (Math.random() - 0.5) * (strokeWidth * 1.4);
              const dotSize = Math.random() < 0.6 ? 1 : 1.5;
              const dotAlpha = (Math.random() * 0.7 * opacity).toFixed(2);
              const dotShade = Math.random() < 0.5 ? '255, 255, 255' : '0, 0, 0';

              ctx.fillStyle = `rgba(${dotShade}, ${dotAlpha})`;
              ctx.fillRect(p2.x + offsetX, p2.y + offsetY, dotSize, dotSize);
            }
          }
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [enabled, isReducedMotion, isTouchDevice, containerRef]);

  // Pointer Movement Event Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || isReducedMotion || isTouchDevice) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    let vx = 0;
    let vy = 0;
    let speed = 0;

    if (lastPointerRef.current) {
      const dt = Math.max(1, now - lastPointerRef.current.time);
      vx = (x - lastPointerRef.current.x) / dt;
      vy = (y - lastPointerRef.current.y) / dt;
      speed = Math.sqrt(vx * vx + vy * vy);
    }

    lastPointerRef.current = { x, y, time: now };

    // Add new point to trail
    pointsRef.current.push({
      x,
      y,
      time: now,
      vx,
      vy,
      speed
    });

    // Spawn tiny monochrome ink flecks during fast movement
    if (speed > 0.8 && Math.random() < 0.7) {
      const fleckCount = Math.min(3, Math.floor(speed * 1.5));
      for (let i = 0; i < fleckCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const fleckSpeed = (Math.random() * 1.5 + 0.5) * speed;
        const colorShade = Math.random() < 0.6 ? '255, 255, 255' : '160, 160, 160';

        flecksRef.current.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * fleckSpeed,
          vy: Math.sin(angle) * fleckSpeed,
          size: Math.random() < 0.7 ? 1 : 2,
          life: now,
          maxLife: 400 + Math.random() * 300,
          color: `rgba(${colorShade}, OPA)`
        });
      }
    }
  };

  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => {
    setIsHovering(false);
    lastPointerRef.current = null;
  };

  if (isReducedMotion || isTouchDevice) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0 z-20 pointer-events-auto cursor-crosshair rounded-sm"
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    />
  );
};
