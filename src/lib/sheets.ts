import { mapRowsToAlbums, albumToRow, SHEET_HEADERS, type Album } from "./csv";
import { getAccessToken, ensureGoogleAuthInteractive, clearGoogleAuth } from "./google-auth";

const CONFIG_KEY = "music-library-sheet-v1";

export type SheetConfig = {
  spreadsheetId: string;
  sheetTitle: string;
  sheetId: number;
  url: string;
  title: string;
};

export function loadSheetConfig(): SheetConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SheetConfig;
  } catch {
    return null;
  }
}

export function saveSheetConfig(cfg: SheetConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearSheetConfig() {
  localStorage.removeItem(CONFIG_KEY);
  clearGoogleAuth();
}

export function extractSpreadsheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function api<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401 && retry) {
    await getAccessToken(true);
    return api<T>(path, init, false);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

type SheetMeta = {
  properties: { title: string };
  sheets: { properties: { sheetId: number; title: string; index: number } }[];
};

async function fetchMeta(spreadsheetId: string): Promise<SheetMeta> {
  return api<SheetMeta>(
    `spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title,index)`,
  );
}

function rangeAll(sheetTitle: string) {
  return `${encodeURIComponent("'" + sheetTitle.replace(/'/g, "''") + "'")}!A1:G100000`;
}

function rangeRow(sheetTitle: string, rowIndex0: number) {
  // rowIndex0 is the data row index (0-based), header is row 1 in sheet → row = rowIndex0 + 2
  const row = rowIndex0 + 2;
  return `${encodeURIComponent("'" + sheetTitle.replace(/'/g, "''") + "'")}!A${row}:G${row}`;
}

export async function connectSheet(url: string): Promise<{ config: SheetConfig; albums: Album[] }> {
  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) throw new Error("URL inválida. Cole a URL completa da planilha.");
  await ensureGoogleAuthInteractive();
  const meta = await fetchMeta(spreadsheetId);
  const firstSheet = [...meta.sheets].sort((a, b) => a.properties.index - b.properties.index)[0];
  if (!firstSheet) throw new Error("Planilha sem abas.");
  const cfg: SheetConfig = {
    spreadsheetId,
    sheetTitle: firstSheet.properties.title,
    sheetId: firstSheet.properties.sheetId,
    url,
    title: meta.properties.title,
  };
  const albums = await fetchAlbumsWithConfig(cfg);
  saveSheetConfig(cfg);
  return { config: cfg, albums };
}

async function fetchAlbumsWithConfig(cfg: SheetConfig): Promise<Album[]> {
  const data = await api<{ values?: string[][] }>(
    `spreadsheets/${cfg.spreadsheetId}/values/${rangeAll(cfg.sheetTitle)}`,
  );
  const rows = data.values ?? [];
  if (rows.length === 0) {
    // empty sheet — initialize headers
    await api(
      `spreadsheets/${cfg.spreadsheetId}/values/${rangeAll(cfg.sheetTitle)}?valueInputOption=RAW`,
      { method: "PUT", body: JSON.stringify({ values: [Array.from(SHEET_HEADERS)] }) },
    );
    return [];
  }
  const header = rows[0].map((h) => (h ?? "").toString().trim().toLowerCase());
  if (!header.includes("disco") || !header.includes("artista")) {
    throw new Error('A planilha precisa ter pelo menos as colunas "Disco" e "Artista" no cabeçalho.');
  }
  return mapRowsToAlbums(rows[0], rows.slice(1));
}

export async function fetchAlbums(cfg: SheetConfig): Promise<Album[]> {
  return fetchAlbumsWithConfig(cfg);
}

export async function appendAlbumToSheet(cfg: SheetConfig, album: Album): Promise<void> {
  await api(
    `spreadsheets/${cfg.spreadsheetId}/values/${rangeAll(cfg.sheetTitle)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [albumToRow(album)] }) },
  );
}

export async function updateAlbumInSheet(
  cfg: SheetConfig,
  rowIndex0: number,
  album: Album,
): Promise<void> {
  await api(
    `spreadsheets/${cfg.spreadsheetId}/values/${rangeRow(cfg.sheetTitle, rowIndex0)}?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: [albumToRow(album)] }) },
  );
}

export async function deleteAlbumFromSheet(cfg: SheetConfig, rowIndex0: number): Promise<void> {
  // header is row 0 in API terms, data starts at startIndex=rowIndex0+1
  await api(`spreadsheets/${cfg.spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: cfg.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex0 + 1,
              endIndex: rowIndex0 + 2,
            },
          },
        },
      ],
    }),
  });
}
