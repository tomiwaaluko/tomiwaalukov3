import { hostedMusic } from './hostedMedia';

export interface MusicTrack {
  src: string;
  title: string;
  artist: string;
}

/** Daft Punk — Tron: Legacy (film soundtrack). Files are on GitHub Release media-v1. */
export const TRON_LEGACY_TRACKS: MusicTrack[] = [
  { src: hostedMusic.arrival, title: 'Arrival', artist: 'Daft Punk' },
  { src: hostedMusic.sonOfFlynn, title: 'The Son of Flynn', artist: 'Daft Punk' },
  { src: hostedMusic.encomPartIi, title: 'Encom Part II', artist: 'Daft Punk' },
  { src: hostedMusic.endOfLine, title: 'End of Line', artist: 'Daft Punk' },
  { src: hostedMusic.outlands, title: 'Outlands', artist: 'Daft Punk' },
  { src: hostedMusic.adagioForTron, title: 'Adagio for TRON', artist: 'Daft Punk' },
  { src: hostedMusic.flynnLives, title: 'Flynn Lives', artist: 'Daft Punk' },
  { src: hostedMusic.finale, title: 'Finale', artist: 'Daft Punk' },
];

export const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [
  { src: hostedMusic.interstellar, title: 'Interstellar', artist: 'Hans Zimmer' },
  { src: hostedMusic.ifIAmWithYou, title: 'If I Am With You', artist: 'Soundtrack' },
  {
    src: hostedMusic.tsukamori,
    title: 'A Huge Tree in the Tsukamori Forest',
    artist: 'Joe Hisaishi',
  },
  {
    src: hostedMusic.dearlyBeloved,
    title: 'Dearly Beloved',
    artist: 'Yoko Shimomura',
  },
];
