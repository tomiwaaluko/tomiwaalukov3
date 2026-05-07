import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// Define the shape of the context data
interface MusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

// Create the context
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Custom hook for easy access to the context
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

// Define the props for the provider component
interface MusicProviderProps {
  children: React.ReactNode;
}

/** Tracks in `public/music/` — new files can be appended here. */
const MUSIC_TRACKS = [
  '/music/background-music.mp3',
  '/music/If-I-Am-With-You.mp3',
] as const;

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7); // Default volume at 30%
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>([]);
  const trackIndexRef = useRef(0);

  useEffect(() => {
    playlistRef.current = shuffleInPlace([...MUSIC_TRACKS]);
    trackIndexRef.current = 0;

    const audio = new Audio(playlistRef.current[0]);
    audio.loop = false;
    audioRef.current = audio;

    const advanceTrack = () => {
      const list = playlistRef.current;
      if (list.length === 0) return;
      trackIndexRef.current = (trackIndexRef.current + 1) % list.length;
      audio.src = list[trackIndexRef.current]!;
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => setIsPlaying(false));
      }
    };

    const onEnded = () => {
      advanceTrack();
    };
    audio.addEventListener('ended', onEnded);

    const playAudio = () => {
      if (!audioRef.current) return;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
          document.removeEventListener('scroll', handleInteraction);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    };

    const handleInteraction = () => {
      playAudio();
    };

    playAudio();

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    document.addEventListener('scroll', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audioRef.current = null;
      playlistRef.current = [];
    };
  }, []);

  // Effect to control the audio element's volume based on state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Function to toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  // Function to toggle mute/unmute
  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => !prevMuted);
  }, []);

  // Function to set a new volume
  const handleSetVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume)); // Ensure volume is between 0 and 1
    setVolume(clampedVolume);
  }, []);

  // The value object provided to consuming components
  const value: MusicContextType = {
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    volume,
    setVolume: handleSetVolume,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};