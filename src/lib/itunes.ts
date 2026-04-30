import type { Album } from "./csv";
import { spotifySearchUrl, youtubeMusicSearchUrl } from "./streaming";

type ITunesResult = {
  artworkUrl100?: string;
  releaseDate?: string;
  collectionName?: string;
  artistName?: string;
};

export async function fetchAlbumMetadata(
  artista: string,
  disco: string,
): Promise<{ capa?: string; ano?: string }> {
  const term = encodeURIComponent(`${artista} ${disco}`.trim());
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = (await res.json()) as { results?: ITunesResult[] };
    const r = data.results?.[0];
    if (!r) return {};
    let capa: string | undefined;
    if (r.artworkUrl100) {
      capa = r.artworkUrl100.replace("100x100bb", "600x600bb").replace("100x100", "600x600");
    }
    let ano: string | undefined;
    if (r.releaseDate) {
      const y = r.releaseDate.slice(0, 4);
      if (/^\d{4}$/.test(y)) ano = y;
    }
    return { capa, ano };
  } catch {
    return {};
  }
}

export async function enrichAlbum(album: Album): Promise<Album> {
  const meta = await fetchAlbumMetadata(album.artista, album.disco);
  return {
    ...album,
    capa: album.capa || meta.capa,
    ano: album.ano || meta.ano,
    spotify: album.spotify || spotifySearchUrl(album.artista, album.disco),
    youtubeMusic: album.youtubeMusic || youtubeMusicSearchUrl(album.artista, album.disco),
    enriched: true,
  };
}

// Run a list of async tasks with limited concurrency.
export async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
  onProgress?: (done: number, total: number, result: R, item: T, index: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;
  const runners = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (true) {
      const i = next++;
      if (i >= total) break;
      const r = await worker(items[i], i);
      results[i] = r;
      done++;
      onProgress?.(done, total, r, items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}
