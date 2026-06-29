import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { formatDuration } from '../utils/fileUtils';

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

export default function AudioPlayer({ src, duration: expectedDuration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(expectedDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate deterministic wave heights for a realistic waveform
  useEffect(() => {
    const barsCount = 28;
    const heights = [];
    // Use a pseudo-random seed based on src to keep waveform consistent for same file
    let seed = 0;
    for (let i = 0; i < src.length; i++) {
      seed += src.charCodeAt(i);
    }
    
    for (let i = 0; i < barsCount; i++) {
      const angle = (i / barsCount) * Math.PI * 3;
      const wave = Math.abs(Math.sin(angle) * 0.7 + Math.sin(angle * 2.3) * 0.3);
      const randomOffset = ((seed + i) % 10) / 10 * 0.3;
      heights.push(Math.max(15, Math.min(100, Math.round((wave + randomOffset) * 100))));
    }
    setWaveformData(heights);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Audio playback failed', err);
      });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // If metadata is already loaded
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [src]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = (val / 100) * duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-emerald-50/70 dark:bg-zinc-800/40 p-3 rounded-2xl w-full max-w-[280px] sm:max-w-[320px] shadow-sm border border-emerald-100/50 dark:border-zinc-700/30">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        id={`audio-play-btn-${src.slice(-10)}`}
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform and Progress Bar Area */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="relative h-10 flex items-center gap-[2px] w-full pt-1">
          {waveformData.map((height, idx) => {
            const barProgress = (idx / waveformData.length) * 100;
            const isActive = progressPercent >= barProgress;
            return (
              <div
                key={idx}
                className="w-[3px] rounded-full transition-all duration-150"
                style={{
                  height: `${height}%`,
                  backgroundColor: isActive 
                    ? '#10b981' // Tailwind emerald-500
                    : 'rgba(161, 161, 170, 0.4)' // Tailwind zinc-400 with opacity
                }}
              />
            );
          })}

          {/* Invisible slider over waveform for seeking */}
          <input
            id={`audio-slider-${src.slice(-10)}`}
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <span>{formatDuration(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 opacity-60" />
            <span>{formatDuration(duration || expectedDuration || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
