import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Trash2, Pencil, Check, X } from "lucide-react";
import type { Album } from "@/lib/csv";

export type AlbumChanges = {
  disco: string;
  artista: string;
  ano?: string;
  capa?: string;
  spotify?: string;
  youtubeMusic?: string;
};

type Props = {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (album: Album) => void;
  onEdit: (original: Album, changes: AlbumChanges) => Album | null;
};

const isSafeUrl = (url: string | undefined): url is string => {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

export function AlbumDialog({ album, open, onOpenChange, onDelete, onEdit }: Props) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<Album | null>(album);
  const [draft, setDraft] = useState<AlbumChanges>({
    disco: "",
    artista: "",
  });

  useEffect(() => {
    setCurrent(album);
    setEditing(false);
    setConfirmDel(false);
  }, [album]);

  if (!current) return null;

  const startEdit = () => {
    setDraft({
      disco: current.disco,
      artista: current.artista,
      ano: current.ano ?? "",
      capa: current.capa ?? "",
      spotify: current.spotify ?? "",
      youtubeMusic: current.youtubeMusic ?? "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    if (!draft.disco.trim() || !draft.artista.trim()) return;
    const changes: AlbumChanges = {
      disco: draft.disco.trim(),
      artista: draft.artista.trim(),
      ano: draft.ano?.trim() || undefined,
      capa: draft.capa?.trim() || undefined,
      spotify: draft.spotify?.trim() || undefined,
      youtubeMusic: draft.youtubeMusic?.trim() || undefined,
    };
    const updated = onEdit(current, changes);
    if (updated) {
      setCurrent(updated);
      setEditing(false);
    }
  };

  const spotify = isSafeUrl(current.spotify) ? current.spotify : undefined;
  const yt = isSafeUrl(current.youtubeMusic) ? current.youtubeMusic : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setConfirmDel(false);
          setEditing(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold leading-tight">
            {current.disco}
          </DialogTitle>
          <DialogDescription>
            {current.artista}
            {current.ano ? ` · ${current.ano}` : ""}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ed-disco">Nome do álbum</Label>
              <Input
                id="ed-disco"
                value={draft.disco}
                onChange={(e) => setDraft((d) => ({ ...d, disco: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <div className="grid gap-2">
                <Label htmlFor="ed-artista">Artista</Label>
                <Input
                  id="ed-artista"
                  value={draft.artista}
                  onChange={(e) => setDraft((d) => ({ ...d, artista: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ed-ano">Ano</Label>
                <Input
                  id="ed-ano"
                  value={draft.ano ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, ano: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ed-capa">URL da capa</Label>
              <Input
                id="ed-capa"
                value={draft.capa ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, capa: e.target.value }))}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ed-spotify">URL do Spotify</Label>
              <Input
                id="ed-spotify"
                value={draft.spotify ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, spotify: e.target.value }))}
                placeholder="https://open.spotify.com/album/..."
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ed-yt">URL do YouTube Music</Label>
              <Input
                id="ed-yt"
                value={draft.youtubeMusic ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, youtubeMusic: e.target.value }))}
                placeholder="https://music.youtube.com/..."
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">
                <X className="size-4" />
                Cancelar
              </Button>
              <Button onClick={saveEdit} className="rounded-xl">
                <Check className="size-4" />
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted">
              {current.capa ? (
                <img
                  src={current.capa}
                  alt={`Capa de ${current.disco}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  Sem capa
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {spotify && (
                <a href={spotify} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full justify-between rounded-xl" size="lg">
                    Abrir no Spotify
                    <ExternalLink className="size-4" />
                  </Button>
                </a>
              )}
              {yt && (
                <a href={yt} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="secondary"
                    className="w-full justify-between rounded-xl"
                    size="lg"
                  >
                    Abrir no YouTube Music
                    <ExternalLink className="size-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                className="w-full justify-between rounded-xl"
                onClick={startEdit}
              >
                Editar
                <Pencil className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {!editing && (
          <DialogFooter className="mt-2 sm:justify-between">
            {confirmDel ? (
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Excluir este álbum?</span>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setConfirmDel(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(current);
                      setConfirmDel(false);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDel(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Excluir álbum
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
