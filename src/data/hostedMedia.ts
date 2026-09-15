/**
 * Videos and MP3s live on GitHub Release `media-v1`, not in Vercel output.
 * Shipping them in `public/` made every retained deploy ~522 MB.
 */
const BASE =
  'https://github.com/tomiwaaluko/tomiwaalukov3/releases/download/media-v1';

function file(name: string): string {
  return `${BASE}/${encodeURIComponent(name)}`;
}

export const hostedVideo = {
  standin: file('standinvideo.mp4'),
  romcom: file('romcomvideo.mp4'),
  agentAthon: file('winningvideo.mov'),
  skygo: file('skygo.mp4'),
  skygoFront: file('skygo-front.mp4'),
  chalk: file('chalkfinal.mp4'),
  civicLens: file('CivicLens.mp4'),
  nsbeApp: file('NSBEAPP2.mp4'),
  ucfAlphas: file('ucfalphasvideo.mp4'),
  tomiwaPortfolio: file('video.mp4'),
} as const;

export const hostedMusic = {
  arrival: file('Arrival.mp3'),
  sonOfFlynn: file('The.Son.of.Flynn.mp3'),
  encomPartIi: file('Encom.Part.II.mp3'),
  endOfLine: file('End.of.Line.mp3'),
  outlands: file('Outlands.mp3'),
  adagioForTron: file('Adagio.For.TRON.mp3'),
  flynnLives: file('Flynn.Lives.mp3'),
  finale: file('Finale.mp3'),
  interstellar: file('Interstellar.mp3'),
  ifIAmWithYou: file('If-I-Am-With-You.mp3'),
  tsukamori: file('A.Huge.Tree.in.the.Tsukamori.Forest.mp3'),
  dearlyBeloved: file('Dearly.Beloved.-.KINGDOM.HEARTS.II.Version-.mp3'),
} as const;
