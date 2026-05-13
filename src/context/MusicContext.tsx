import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useTronTheme } from './TronThemeContext';
import { DEFAULT_MUSIC_TRACKS, TRON_LEGACY_TRACKS, type MusicTrack } from '../data/musicTracks';

interface MusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentTrack: MusicTrack | null;
  currentTime: number;
  duration: number;
  skipNext: () => void;
  skipPrevious: () => void;
  isTronPlaylist: boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: React.ReactNode;
}

function shuffleInPlace<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j]!;
    a[j] = t!;
  }
  return a;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const { isTronTheme } = useTronTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<MusicTrack[]>([]);
  const trackIndexRef = useRef(0);
  const lastUiTickRef = useRef(0);
  /** Browser autoplay policy: we may start muted until the first user gesture. */
  const policyMutedUntilGestureRef = useRef(false);
  /** Invalidates in-flight play retries when the user skips again before the new file is ready. */
  const playbackGenerationRef = useRef(0);
  const cancelPendingPlayRetryRef = useRef<(() => void) | null>(null);

  const isTronPlaylist = isTronTheme;

  const playAfterSourceChange = useCallback((audio: HTMLAudioElement, generation: number) => {
    cancelPendingPlayRetryRef.current?.();
    cancelPendingPlayRetryRef.current = null;

    const tryPlay = () => {
      void audio.play().then(() => {
        if (playbackGenerationRef.current !== generation) return;
        setIsPlaying(true);
      }).catch(() => {
        if (playbackGenerationRef.current !== generation) return;
        setIsPlaying(false);
      });
    };

    void audio.play().then(() => {
      if (playbackGenerationRef.current !== generation) return;
      setIsPlaying(true);
    }).catch(() => {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        cancelPendingPlayRetryRef.current = null;
        if (playbackGenerationRef.current !== generation) return;
        tryPlay();
      };
      cancelPendingPlayRetryRef.current = () => {
        audio.removeEventListener('canplay', onCanPlay);
      };
      audio.addEventListener('canplay', onCanPlay);
      // canplay may have fired before this listener was added (cached / fast load)
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        queueMicrotask(() => {
          if (playbackGenerationRef.current !== generation) return;
          onCanPlay();
        });
      }
    });
  }, []);

  const goToIndex = useCallback(
    (index: number, autoplay: boolean) => {
      const audio = audioRef.current;
      const list = playlistRef.current;
      if (!audio || list.length === 0) return;
      const i = ((index % list.length) + list.length) % list.length;
      trackIndexRef.current = i;
      const track = list[i]!;
      cancelPendingPlayRetryRef.current?.();
      cancelPendingPlayRetryRef.current = null;
      audio.pause();
      audio.src = track.src;
      audio.load();
      setCurrentTrack(track);
      setCurrentTime(0);
      if (autoplay) {
        playbackGenerationRef.current += 1;
        playAfterSourceChange(audio, playbackGenerationRef.current);
      }
    },
    [playAfterSourceChange],
  );

  const advanceTrack = useCallback(() => {
    const list = playlistRef.current;
    if (list.length === 0) return;
    const next = (trackIndexRef.current + 1) % list.length;
    goToIndex(next, true);
  }, [goToIndex]);

  const skipNext = useCallback(() => {
    advanceTrack();
  }, [advanceTrack]);

  const skipPrevious = useCallback(() => {
    const list = playlistRef.current;
    if (list.length === 0) return;
    const prev = (trackIndexRef.current - 1 + list.length) % list.length;
    goToIndex(prev, true);
  }, [goToIndex]);

  useEffect(() => {
    const sourceTracks = isTronTheme ? [...TRON_LEGACY_TRACKS] : [...DEFAULT_MUSIC_TRACKS];
    playlistRef.current = shuffleInPlace(sourceTracks);
    trackIndexRef.current = 0;

    const first = playlistRef.current[0]!;
    const audio = new Audio(first.src);
    audio.loop = false;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audioRef.current = audio;
    setCurrentTrack(first);
    setCurrentTime(0);
    setDuration(0);

    const onEnded = () => {
      const list = playlistRef.current;
      if (list.length === 0) return;
      const next = (trackIndexRef.current + 1) % list.length;
      trackIndexRef.current = next;
      const t = list[next]!;
      cancelPendingPlayRetryRef.current?.();
      cancelPendingPlayRetryRef.current = null;
      audio.pause();
      audio.src = t.src;
      audio.load();
      setCurrentTrack(t);
      setCurrentTime(0);
      playbackGenerationRef.current += 1;
      playAfterSourceChange(audio, playbackGenerationRef.current);
    };

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const onTimeUpdate = () => {
      const now = performance.now();
      if (now - lastUiTickRef.current < 220) return;
      lastUiTickRef.current = now;
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);

    const gestureOpts = { capture: true } as const;

    const onUserGesture = () => {
      const el = audioRef.current;
      if (!el) return;
      // Always unmute on first user gesture — covers both the policy-muted path
      // and the edge case where el.muted was left true after both autoplay attempts failed.
      el.muted = false;
      policyMutedUntilGestureRef.current = false;
      if (el.paused) {
        void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      document.removeEventListener('pointerdown', onUserGesture, gestureOpts);
      document.removeEventListener('keydown', onUserGesture, gestureOpts);
      document.removeEventListener('touchstart', onUserGesture, gestureOpts);
      document.removeEventListener('scroll', onUserGesture, gestureOpts);
      document.removeEventListener('click', onUserGesture, gestureOpts);
    };

    const attachGestureListeners = () => {
      document.addEventListener('pointerdown', onUserGesture, gestureOpts);
      document.addEventListener('keydown', onUserGesture, gestureOpts);
      document.addEventListener('touchstart', onUserGesture, gestureOpts);
      document.addEventListener('scroll', onUserGesture, gestureOpts);
      document.addEventListener('click', onUserGesture, gestureOpts);
    };

    const detachGestureListeners = () => {
      document.removeEventListener('pointerdown', onUserGesture, gestureOpts);
      document.removeEventListener('keydown', onUserGesture, gestureOpts);
      document.removeEventListener('touchstart', onUserGesture, gestureOpts);
      document.removeEventListener('scroll', onUserGesture, gestureOpts);
      document.removeEventListener('click', onUserGesture, gestureOpts);
    };

    const startPlayback = async () => {
      const el = audioRef.current;
      if (!el) return;

      try {
        await el.play();
        setIsPlaying(true);
        policyMutedUntilGestureRef.current = false;
        return;
      } catch {
        /* autoplay with sound blocked */
      }

      try {
        el.muted = true;
        policyMutedUntilGestureRef.current = true;
        await el.play();
        setIsPlaying(true);
        attachGestureListeners();
        return;
      } catch {
        // Both unmuted and muted autoplay failed — reset muted so audio
        // isn't silently stuck on mute when the gesture handler fires.
        el.muted = false;
        policyMutedUntilGestureRef.current = false;
        setIsPlaying(false);
      }

      attachGestureListeners();
    };

    void startPlayback();

    return () => {
      cancelPendingPlayRetryRef.current?.();
      cancelPendingPlayRetryRef.current = null;
      detachGestureListeners();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.pause();
      audioRef.current = null;
      playlistRef.current = [];
    };
  }, [isTronTheme, playAfterSourceChange]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Pause when the tab loses focus, resume when it regains focus
  useEffect(() => {
    const wasPlayingRef = { current: false };

    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        wasPlayingRef.current = !audio.paused;
        if (!audio.paused) {
          audio.pause();
          setIsPlaying(false);
        }
      } else if (wasPlayingRef.current) {
        void audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Ensure audio isn't stuck muted from a failed autoplay attempt
      audioRef.current.muted = isMuted;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const handleSetVolume = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const value: MusicContextType = {
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    volume,
    setVolume: handleSetVolume,
    currentTrack,
    currentTime,
    duration,
    skipNext,
    skipPrevious,
    isTronPlaylist,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};
