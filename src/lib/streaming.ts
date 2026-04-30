export function spotifySearchUrl(artista: string, disco: string): string {
  const q = encodeURIComponent(`${artista} ${disco}`.trim());
  return `https://open.spotify.com/search/${q}`;
}

export function youtubeMusicSearchUrl(artista: string, disco: string): string {
  const q = encodeURIComponent(`${artista} ${disco}`.trim());
  return `https://music.youtube.com/search?q=${q}`;
}
