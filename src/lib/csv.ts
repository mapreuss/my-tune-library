export type Album = {
  disco: string;
  artista: string;
  ano?: string;
  capa?: string;
  spotify?: string;
  youtubeMusic?: string;
  tipo?: string;
  enriched?: boolean;
};

// RFC4180-ish parser supporting quoted fields with commas and escaped quotes ("").
export function parseCSV(text: string): Album[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDisco = idx("disco");
  const iArtista = idx("artista");
  const iAno = idx("ano");
  const iCapa = idx("capa");
  const iSpotify = idx("spotify");
  const iYt = idx("youtubemusic");
  const iTipo = idx("tipo");

  const albums: Album[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    if (cols.every((c) => c.trim() === "")) continue;
    const disco = (iDisco >= 0 ? cols[iDisco] : cols[0] || "").trim();
    const artista = (iArtista >= 0 ? cols[iArtista] : cols[1] || "").trim();
    if (!disco && !artista) continue;
    albums.push({
      disco,
      artista,
      ano: iAno >= 0 ? (cols[iAno] || "").trim() || undefined : undefined,
      capa: iCapa >= 0 ? (cols[iCapa] || "").trim() || undefined : undefined,
      spotify: iSpotify >= 0 ? (cols[iSpotify] || "").trim() || undefined : undefined,
      youtubeMusic: iYt >= 0 ? (cols[iYt] || "").trim() || undefined : undefined,
      tipo: iTipo >= 0 ? (cols[iTipo] || "").trim().toLowerCase() || undefined : undefined,
    });
  }
  return albums;
}

function escape(value: string | undefined): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function serializeCSV(albums: Album[]): string {
  const header = ["Disco", "Artista", "Ano", "Capa", "Spotify", "YouTubeMusic"];
  const lines = [header.join(",")];
  for (const a of albums) {
    lines.push(
      [a.disco, a.artista, a.ano, a.capa, a.spotify, a.youtubeMusic]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCSV(albums: Album[], filename = "biblioteca.csv") {
  const csv = serializeCSV(albums);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
