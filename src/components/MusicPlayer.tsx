import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MusicPlayer: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    currentTrack,
    currentTime,
    duration,
    skipNext,
    skipPrevious,
    isTronPlaylist,
  } = useMusic();

  const [minimized, setMinimized] = useState(false);

  const spring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.85 };

  return (
    <motion.div
      layout
      transition={spring}
      className={`fixed z-[200] pointer-events-auto select-none rounded-none ${
        minimized
          ? 'bottom-5 right-5 sm:bottom-8 sm:right-8 h-14 w-14'
          : 'bottom-5 right-5 sm:bottom-8 sm:right-8 w-[min(92vw,20rem)]'
      }`}
      style={{ cursor: 'auto' }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-none border border-white/25 bg-black/35 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      >
        <div className={minimized ? 'relative flex h-full w-full items-center justify-center' : 'p-3.5 pt-3'}>
          {minimized ? (
            <>
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-full w-full items-center justify-center rounded-none text-cream-400 transition-transform hover:opacity-90 active:opacity-80"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-6 w-6" strokeWidth={1.75} /> : <Play className="h-6 w-6 pl-0.5" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-none bg-white/15 text-cream-400 hover:bg-white/25"
                aria-label="Expand music player"
              >
                <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              {isPlaying && (
                <span className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 bg-cream-400 shadow-[0_0_8px_currentColor]" />
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-cream-500/30 bg-cream-500/10 text-cream-400">
                    <Music2 className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      {isTronPlaylist ? 'TRON · Legacy' : 'Now playing'}
                    </p>
                    <p className="truncate text-sm font-semibold tracking-tight text-white">
                      {currentTrack?.title ?? '—'}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{currentTrack?.artist ?? ''}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="shrink-0 rounded-none p-1.5 text-zinc-500 transition-colors hover:bg-white/15 hover:text-cream-400"
                  aria-label="Minimize music player"
                >
                  <ChevronUp className="h-5 w-5 rotate-180" strokeWidth={2} />
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={skipPrevious}
                  className="rounded-none p-2 text-cream-400 transition-colors hover:bg-white/15"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-11 w-11 items-center justify-center rounded-none border border-cream-500/40 bg-cream-500/15 text-cream-400 transition-opacity hover:opacity-90 active:opacity-80"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-5 w-5" strokeWidth={2} /> : <Play className="h-5 w-5 pl-0.5" strokeWidth={2} />}
                </button>
                <button
                  type="button"
                  onClick={skipNext}
                  className="rounded-none p-2 text-cream-400 transition-colors hover:bg-white/15"
                  aria-label="Next track"
                >
                  <SkipForward className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MusicPlayer;
