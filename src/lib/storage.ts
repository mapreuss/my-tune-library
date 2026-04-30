import type { Album } from "./csv";

const KEY = "music-library-v1";

export function loadLibrary(): Album[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Album[];
  } catch {
    return null;
  }
}

export function saveLibrary(albums: Album[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(albums));
  } catch (e) {
    console.error("Falha ao salvar biblioteca", e);
  }
}

export function clearLibrary() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
