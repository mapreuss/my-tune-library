import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Plus, Download, Upload, Trash2, Search, Music2, Shuffle } from "lucide-react";
import { AlbumCard } from "@/components/AlbumCard";
import { AlbumDialog } from "@/components/AlbumDialog";
import { AddAlbumDialog } from "@/components/AddAlbumDialog";
import { ImportPrompt } from "@/components/ImportPrompt";
import {
  parseCSV,
  downloadCSV,
  type Album,
} from "@/lib/csv";
import { loadLibrary, saveLibrary, clearLibrary } from "@/lib/storage";
import { enrichAlbum, runWithConcurrency } from "@/lib/itunes";

export const Route = createFileRoute("/")({
  component: Index,
});

type SortMode = "artist" | "album";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sortAlbums(list: Album[], mode: SortMode): Album[] {
  const arr = [...list];
  if (mode === "album") {
    arr.sort((a, b) => normalize(a.disco).localeCompare(normalize(b.disco), "pt-BR"));
  } else {
    arr.sort((a, b) => {
      const ar = normalize(a.artista).localeCompare(normalize(b.artista), "pt-BR");
      if (ar !== 0) return ar;
      const ay = a.ano ? parseInt(a.ano, 10) : NaN;
      const by = b.ano ? parseInt(b.ano, 10) : NaN;
      const aHas = !isNaN(ay);
      const bHas = !isNaN(by);
      if (aHas && bHas) {
        if (ay !== by) return ay - by;
      } else if (aHas !== bHas) {
        return aHas ? -1 : 1;
      }
      return normalize(a.disco).localeCompare(normalize(b.disco), "pt-BR");
    });
  }
  return arr;
}

function albumKey(a: Album) {
  return `${normalize(a.artista)}::${normalize(a.disco)}`;
}

function Index() {
  const [hydrated, setHydrated] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [hasLibrary, setHasLibrary] = useState(false);
  const [sort, setSort] = useState<SortMode>("artist");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Album | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [enriching, setEnriching] = useState<{ done: number; total: number } | null>(null);
  const [pendingImport, setPendingImport] = useState<Album[] | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadLibrary();
    if (stored && stored.length > 0) {
      setAlbums(stored);
      setHasLibrary(true);
    }
    setHydrated(true);
  }, []);

  // Persist whenever albums change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (hasLibrary) saveLibrary(albums);
  }, [albums, hydrated, hasLibrary]);

  // Background enrichment
  useEffect(() => {
    if (!hydrated || !hasLibrary) return;
    const pending = albums.filter((a) => !a.enriched || !a.capa);
    if (pending.length === 0) return;
    let cancelled = false;
    setEnriching({ done: 0, total: pending.length });

    (async () => {
      await runWithConcurrency(
        pending,
        async (a) => {
          const enriched = await enrichAlbum(a);
          if (cancelled) return enriched;
          setAlbums((prev) => {
            const key = albumKey(a);
            return prev.map((p) => (albumKey(p) === key ? { ...p, ...enriched } : p));
          });
          return enriched;
        },
        4,
        (done, total) => {
          if (!cancelled) setEnriching({ done, total });
        },
      );
      if (!cancelled) setEnriching(null);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hasLibrary]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const base = q
      ? albums.filter(
          (a) => normalize(a.disco).includes(q) || normalize(a.artista).includes(q),
        )
      : albums;
    return sortAlbums(base, sort);
  }, [albums, query, sort]);

  const handleLoad = (loaded: Album[]) => {
    setAlbums(loaded);
    setHasLibrary(true);
    saveLibrary(loaded);
    toast.success(`${loaded.length} álbuns importados`);
  };

  const handleAdd = (artista: string, disco: string) => {
    const key = `${normalize(artista)}::${normalize(disco)}`;
    if (albums.some((a) => albumKey(a) === key)) {
      toast.error("Este álbum já está na biblioteca");
      return;
    }
    const novo: Album = { artista, disco, enriched: false };
    setAlbums((prev) => [...prev, novo]);
    toast.success("Álbum adicionado, buscando metadados...");
  };

  const handleDelete = (album: Album) => {
    const key = albumKey(album);
    setAlbums((prev) => prev.filter((a) => albumKey(a) !== key));
    setSelected(null);
    toast.success("Álbum removido");
  };

  const handleEdit = (
    original: Album,
    changes: { disco: string; artista: string; ano?: string },
  ): Album | null => {
    const oldKey = albumKey(original);
    const newKey = `${normalize(changes.artista)}::${normalize(changes.disco)}`;
    if (newKey !== oldKey && albums.some((a) => albumKey(a) === newKey)) {
      toast.error("Já existe um álbum com esse artista e nome");
      return null;
    }
    let updated: Album | null = null;
    setAlbums((prev) =>
      prev.map((p) => {
        if (albumKey(p) !== oldKey) return p;
        updated = {
          ...p,
          disco: changes.disco,
          artista: changes.artista,
          ano: changes.ano,
        };
        return updated;
      }),
    );
    toast.success("Álbum atualizado");
    return updated;
  };

  const handleRefetch = async (album: Album) => {
    const key = albumKey(album);
    const refreshed = await enrichAlbum({ ...album, capa: undefined, ano: undefined, enriched: false });
    setAlbums((prev) => prev.map((p) => (albumKey(p) === key ? { ...p, ...refreshed } : p)));
    setSelected(refreshed);
    toast.success("Metadados atualizados");
  };

  const handleExport = () => {
    if (albums.length === 0) {
      toast.error("Nada para exportar");
      return;
    }
    downloadCSV(albums);
  };

  const handleImportClick = () => importInputRef.current?.click();

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("Nenhum álbum encontrado no CSV");
        return;
      }
      if (albums.length === 0) {
        setAlbums(parsed);
        setHasLibrary(true);
        toast.success(`${parsed.length} álbuns importados`);
      } else {
        setPendingImport(parsed);
      }
    } catch {
      toast.error("Falha ao ler o CSV");
    }
  };

  const applyImport = (mode: "append" | "merge" | "replace") => {
    if (!pendingImport) return;
    const incoming = pendingImport;
    if (mode === "replace") {
      setAlbums(incoming);
      toast.success(`Biblioteca substituída (${incoming.length} álbuns)`);
    } else if (mode === "append") {
      setAlbums((prev) => {
        const seen = new Set(prev.map(albumKey));
        const added = incoming.filter((a) => !seen.has(albumKey(a)));
        return [...prev, ...added];
      });
      toast.success(`${incoming.length} álbuns adicionados`);
    } else {
      // merge
      const map = new Map(albums.map((a) => [albumKey(a), a]));
      for (const a of incoming) {
        const k = albumKey(a);
        const existing = map.get(k);
        if (existing) {
          map.set(k, {
            ...existing,
            ...a,
            capa: existing.capa || a.capa,
            ano: existing.ano || a.ano,
            spotify: existing.spotify || a.spotify,
            youtubeMusic: existing.youtubeMusic || a.youtubeMusic,
            enriched: existing.enriched,
          });
        } else {
          map.set(k, a);
        }
      }
      setAlbums(Array.from(map.values()));
      toast.success(`Mesclado com ${incoming.length} álbuns`);
    }
    setHasLibrary(true);
    setPendingImport(null);
  };

  const handleRandom = () => {
    const pool = filtered.length > 0 ? filtered : albums;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSelected(pick);
  };

  const handleClear = () => {
    clearLibrary();
    setAlbums([]);
    setHasLibrary(false);
    setConfirmClear(false);
    toast.success("Biblioteca limpa");
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!hasLibrary) {
    return (
      <>
        <ImportPrompt onLoad={handleLoad} />
        <Toaster />
      </>
    );
  }

  const progressPct = enriching ? Math.round((enriching.done / enriching.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {enriching && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-card text-primary">
              <Music2 className="size-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Biblioteca</h1>
            <span className="ml-1 text-sm text-muted-foreground">
              {albums.length} álbuns
            </span>
          </div>

          <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar álbum ou artista"
                className="rounded-xl pl-9"
              />
            </div>

            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artista (A→Z, ano)</SelectItem>
                <SelectItem value="album">Álbum (A→Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRandom}
              className="rounded-xl"
              aria-label="Álbum aleatório"
              disabled={albums.length === 0}
            >
              <Shuffle className="size-4" />
              <span className="hidden sm:inline">Aleatório</span>
            </Button>

            <Button
              onClick={() => setAddOpen(true)}
              className="rounded-xl"
              aria-label="Adicionar álbum"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleImportClick}
              className="rounded-xl"
              aria-label="Importar CSV"
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
                e.target.value = "";
              }}
            />

            <Button
              variant="outline"
              onClick={handleExport}
              className="rounded-xl"
              aria-label="Exportar CSV"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setConfirmClear(true)}
              className="rounded-xl text-destructive hover:text-destructive"
              aria-label="Limpar biblioteca"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
        {enriching && (
          <div className="mx-auto max-w-7xl px-4 pb-2 text-xs text-muted-foreground sm:px-6">
            Buscando metadados… {enriching.done} de {enriching.total}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            Nenhum álbum encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((a) => (
              <AlbumCard key={albumKey(a)} album={a} onClick={() => setSelected(a)} />
            ))}
          </div>
        )}
      </main>

      <AlbumDialog
        album={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onDelete={handleDelete}
        onRefetch={handleRefetch}
        onEdit={handleEdit}
      />

      <AddAlbumDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar toda a biblioteca?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove todos os álbuns do armazenamento local. Você pode reimportar um CSV
              depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear}>Limpar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingImport} onOpenChange={(o) => !o && setPendingImport(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Como deseja importar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {albums.length} álbuns na biblioteca e o CSV traz {pendingImport?.length ?? 0}.
              Escolha o que fazer:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => applyImport("append")}
            >
              <Plus className="size-4" />
              Adicionar — só inclui novos (ignora duplicados)
            </Button>
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => applyImport("merge")}
            >
              <Upload className="size-4" />
              Mesclar — combina por artista + nome, mantendo enriquecimento
            </Button>
            <Button
              variant="destructive"
              className="justify-start rounded-xl"
              onClick={() => applyImport("replace")}
            >
              <Trash2 className="size-4" />
              Sobrescrever — apaga tudo e usa apenas o novo CSV
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}
