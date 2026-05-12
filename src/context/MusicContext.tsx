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

  const isTronPlaylist = isTronTheme;

  const goToIndex = useCallback((index: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const list = playlistRef.current;
    if (!audio || list.length === 0) return;
    const i = ((index % list.length) + list.length) % list.length;
    trackIndexRef.current = i;
    const track = list[i]!;
    audio.src = track.src;
    setCurrentTrack(track);
    setCurrentTime(0);
    if (autoplay) {
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, []);

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
      audio.src = t.src;
      setCurrentTrack(t);
      setCurrentTime(0);
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => setIsPlaying(false));
      }
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
      if (policyMutedUntilGestureRef.current) {
        el.muted = false;
        policyMutedUntilGestureRef.current = false;
      }
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
        policyMutedUntilGestureRef.current = false;
        setIsPlaying(false);
      }

      attachGestureListeners();
    };

    void startPlayback();

    return () => {
      detachGestureListeners();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.pause();
      audioRef.current = null;
      playlistRef.current = [];
    };
  }, [isTronTheme]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

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
