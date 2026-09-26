import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  shouldPlay: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ shouldPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current || !shouldPlay) return;

    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.5;

    const playAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio play requested, waiting for user interaction or file:', err);
      }
    };

    playAudio();
  }, [shouldPlay]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (!isPlaying) {
      audio.muted = false;
      setIsMuted(false);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Audio play failed:', e));
    } else {
      // Toggle mute/unmute when audio is active
      const nextMute = !isMuted;
      audio.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  return (
    <div className="flex items-center select-none">
      {/* Hidden HTML5 Audio Element supporting /music/background.mp3 and /audio.mp3 */}
      <audio
        ref={audioRef}
        preload="auto"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.includes('/music/background.mp3')) {
            target.src = '/audio.mp3';
            if (shouldPlay) target.play().catch(() => {});
          }
        }}
      >
        <source src="/music/background.mp3" type="audio/mpeg" />
        <source src="/audio.mp3" type="audio/mpeg" />
      </audio>

      {/* Glass Audio Icon Button (Only visible on main page) */}
      {shouldPlay && (
        <button
          onClick={toggleAudio}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white backdrop-blur-xl transition-all duration-300 shadow-lg focus:outline-none cursor-pointer border border-white/15 group"
          title={isPlaying && !isMuted ? 'Mute Music' : 'Unmute / Play Music'}
          aria-label="Toggle Audio Mute"
        >
          {isPlaying && !isMuted ? (
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          )}
        </button>
      )}
    </div>
  );
};
