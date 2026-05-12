export interface MusicTrack {
  src: string;
  title: string;
  artist: string;
}

const tronBase = '/music/tron-legacy';

/** Daft Punk — Tron: Legacy (film soundtrack). Paths match files in `public/music/tron-legacy/`. */
export const TRON_LEGACY_TRACKS: MusicTrack[] = [
  { src: `${tronBase}/Arrival.mp3`, title: 'Arrival', artist: 'Daft Punk' },
  { src: `${tronBase}/The Son of Flynn.mp3`, title: 'The Son of Flynn', artist: 'Daft Punk' },
  { src: `${tronBase}/Encom Part II.mp3`, title: 'Encom Part II', artist: 'Daft Punk' },
  { src: `${tronBase}/End of Line.mp3`, title: 'End of Line', artist: 'Daft Punk' },
  { src: `${tronBase}/Outlands.mp3`, title: 'Outlands', artist: 'Daft Punk' },
  { src: `${tronBase}/Adagio For TRON.mp3`, title: 'Adagio for TRON', artist: 'Daft Punk' },
  { src: `${tronBase}/Flynn Lives.mp3`, title: 'Flynn Lives', artist: 'Daft Punk' },
  { src: `${tronBase}/Finale.mp3`, title: 'Finale', artist: 'Daft Punk' },
];

export const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [
  { src: '/music/Interstellar.mp3', title: 'Interstellar', artist: 'Hans Zimmer' },
  { src: '/music/If-I-Am-With-You.mp3', title: 'If I Am With You', artist: 'Soundtrack' },
  { src: '/music/background-music.mp3', title: 'Ambient', artist: 'Portfolio' },
];
