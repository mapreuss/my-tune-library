import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import type { Album } from "@/lib/csv";
import { spotifySearchUrl, youtubeMusicSearchUrl } from "@/lib/streaming";

type Props = {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (album: Album) => void;
  onRefetch: (album: Album) => Promise<void>;
};

export function AlbumDialog({ album, open, onOpenChange, onDelete, onRefetch }: Props) {
  const [refetching, setRefetching] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!album) return null;

  const spotify = album.spotify || spotifySearchUrl(album.artista, album.disco);
  const yt = album.youtubeMusic || youtubeMusicSearchUrl(album.artista, album.disco);

  const handleRefetch = async () => {
    setRefetching(true);
    try {
      await onRefetch(album);
    } finally {
      setRefetching(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmDel(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{album.disco}</DialogTitle>
          <DialogDescription>
            {album.artista}
            {album.ano ? ` · ${album.ano}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-muted">
            {album.capa ? (
              <img
                src={album.capa}
                alt={`Capa de ${album.disco}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Sem capa
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <a href={spotify} target="_blank" rel="noopener noreferrer">
              <Button className="w-full justify-between rounded-xl" size="lg">
                Abrir no Spotify
                <ExternalLink className="size-4" />
              </Button>
            </a>
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
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={handleRefetch}
              disabled={refetching}
            >
              {refetching ? "Buscando..." : "Re-buscar metadados"}
              <RefreshCw className={`size-4 ${refetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

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
                    onDelete(album);
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
      </DialogContent>
    </Dialog>
  );
}
