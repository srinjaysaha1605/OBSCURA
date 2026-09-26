import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGalleryCategories } from '../data/galleryStore';
import { InkTrailCanvas } from './InkTrailCanvas';
import { AdminPanel } from './AdminPanel';
import { AudioPlayer } from './AudioPlayer';
import { Download } from 'lucide-react';

interface GalleryExhibitionProps {
  shouldPlayAudio?: boolean;
}

export const GalleryExhibition: React.FC<GalleryExhibitionProps> = ({ shouldPlayAudio = true }) => {
  const { categories } = useGalleryCategories();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isScrollingRef = useRef<boolean>(false);

  // Global Ctrl + Shift + K shortcut to open Admin Modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Bounds-check activeIndex if items change
  useEffect(() => {
    if (activeIndex >= categories.length) {
      setActiveIndex(Math.max(0, categories.length - 1));
    }
  }, [categories.length, activeIndex]);

  // Next / Previous Navigation
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? categories.length - 1 : prev - 1));
  }, [categories.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === categories.length - 1 ? 0 : prev + 1));
  }, [categories.length]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdminOpen) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= categories.length) {
          setActiveIndex(num - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, categories.length, isAdminOpen]);

  // Mouse wheel scroll support with cooldown threshold
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrollingRef.current || isAdminOpen) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 15) return;

      if (delta > 0) {
        handleNext();
      } else {
        handlePrev();
      }

      isScrollingRef.current = true;
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleNext, handlePrev, isAdminOpen]);

  // Touch Swipe Handlers (Horizontal & Vertical gestures)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAdminOpen) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAdminOpen || touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartXRef.current - touchEndX;
    const diffY = touchStartYRef.current !== null ? touchStartYRef.current - touchEndY : 0;

    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
      if (Math.abs(diffX) >= Math.abs(diffY)) {
        if (diffX > 0) handleNext();
        else handlePrev();
      } else {
        if (diffY > 0) handleNext();
        else handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Image fallback state handler
  const handleImageError = (id: string) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  // Image download handler
  const handleDownloadImage = async (imagePath: string, altText?: string) => {
    try {
      if (imagePath.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imagePath;
        link.download = `${altText || 'artwork'}_obscura.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const res = await fetch(imagePath);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const fileExt = blob.type.split('/')[1] || 'jpg';
      link.download = `${altText || 'artwork'}_obscura.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download fallback:', e);
      window.open(imagePath, '_blank');
    }
  };

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] bg-[#080808] text-[#e5e5e5] flex flex-col justify-between overflow-hidden paper-grain select-none">
      {/* TOP BAR: Minimal Header */}
      <header className="relative z-30 flex items-center justify-between px-6 py-3.5 md:px-12 border-b border-neutral-900/60 bg-[#080808]/80 backdrop-blur-sm min-h-[57px]">
        <span className="text-xs font-mono-code tracking-[0.35em] text-neutral-200 uppercase font-semibold leading-none">
          O B S C U R A
        </span>
        <AudioPlayer shouldPlay={shouldPlayAudio} />
      </header>

      {/* MAIN GALLERY DISPLAY AREA */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 py-4 md:py-6 max-w-6xl mx-auto w-full overflow-hidden">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-gallery-fade my-auto">
            <span className="text-2xl md:text-3xl font-serif-display text-neutral-400 italic mb-2">
              Gallery is Empty
            </span>
            <p className="text-[11px] font-mono-code text-neutral-600 uppercase tracking-widest">
              [ NO EXHIBITION IMAGES PRESENT ]
            </p>
          </div>
        ) : (
          /* 3D Carousel Container */
          <div
            ref={imageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full max-w-5xl h-[68vh] sm:h-[75vh] md:h-[78vh] flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
              {categories.map((cat, idx) => {
                let offset = idx - activeIndex;
                const total = categories.length;

                // Smooth 3D circular loop offset
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const absOffset = Math.abs(offset);
                const isActive = offset === 0;

                // Calculate 3D transformation values
                let translateX = offset * 55; // percentage
                let translateZ = -absOffset * 220; // px
                let rotateY = offset * -32; // degrees
                let scale = Math.max(0.6, 1 - absOffset * 0.22);
                let opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.45 : 0;
                let zIndex = 30 - absOffset * 10;

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (!isActive) setActiveIndex(idx);
                    }}
                    className={`absolute inset-0 flex items-center justify-center p-2 sm:p-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    style={{
                      transform: `translate3d(${translateX}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                      pointerEvents: absOffset > 1 ? 'none' : 'auto',
                      visibility: opacity === 0 ? 'hidden' : 'visible'
                    }}
                  >
                    {!imageError[cat.id] ? (
                      <img
                        src={cat.imagePath}
                        alt={cat.altText || ''}
                        onError={() => handleImageError(cat.id)}
                        className={`max-w-full max-h-full object-contain transition-all duration-500 select-none pointer-events-none ${
                          isActive
                            ? 'drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)]'
                            : 'opacity-40 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] hover:opacity-70'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-xs font-mono-code text-neutral-500 uppercase tracking-widest">
                          [ IMAGE PLACEHOLDER ]
                        </p>
                      </div>
                    )}

                    {/* Ink Trail Canvas on Active Floating Slide */}
                    {isActive && (
                      <InkTrailCanvas
                        containerRef={imageContainerRef}
                        enabled={true}
                      />
                    )}

                    {/* Floating Glass Download Button */}
                    {isActive && !imageError[cat.id] && (
                      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(cat.imagePath, cat.altText);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-white backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 group focus:outline-none focus:ring-1 focus:ring-white/80 cursor-pointer"
                          title="Download Image"
                          aria-label="Download Image"
                        >
                          <Download className="w-3.5 h-3.5 text-neutral-200 group-hover:text-white group-hover:translate-y-0.5 transition-transform drop-shadow-sm" />
                          <span className="text-[10px] font-mono-code uppercase tracking-wider hidden sm:inline drop-shadow-sm font-medium">
                            Download
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: Numbered Navigation & Thin Progress Bar */}
      <footer className="relative z-30 border-t border-neutral-900/80 bg-[#080808]/90 backdrop-blur-md px-6 py-4 md:px-12">
        {categories.length > 0 && (
          <>
            {/* Progress bar indicator */}
            <div className="w-full h-0.5 bg-neutral-900 mb-3 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-neutral-300 transition-all duration-300 ease-out"
                style={{ width: `${((activeIndex + 1) / categories.length) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-center overflow-x-auto no-scrollbar w-full py-1 px-2">
              {/* Minimal Number Switches */}
              <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
                {categories.map((cat, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-8 h-8 rounded-xs text-xs font-mono-code transition-all focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                        isActive
                          ? 'bg-neutral-200 text-black font-semibold shadow-sm'
                          : 'bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      aria-label={`Go to item ${cat.number}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {cat.number}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </footer>

      {/* Admin Management Modal */}
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
};
