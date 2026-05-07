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
import type { Album } from "@/lib/csv";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (album: Album) => void;
  availableTypes?: string[];
};

export function AddAlbumDialog({ open, onOpenChange, onAdd, availableTypes = [] }: Props) {
  const [disco, setDisco] = useState("");
  const [artista, setArtista] = useState("");
  const [ano, setAno] = useState("");
  const [capa, setCapa] = useState("");
  const [spotify, setSpotify] = useState("");
  const [yt, setYt] = useState("");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    if (!open) {
      setDisco("");
      setArtista("");
      setAno("");
      setCapa("");
      setSpotify("");
      setYt("");
      setTipo("");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = disco.trim();
    const a = artista.trim();
    if (!d || !a) return;
    onAdd({
      disco: d,
      artista: a,
      ano: ano.trim() || undefined,
      capa: capa.trim() || undefined,
      spotify: spotify.trim() || undefined,
      youtubeMusic: yt.trim() || undefined,
      tipo: tipo.trim().toLowerCase() || undefined,
      enriched: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar álbum</DialogTitle>
          <DialogDescription>
            Preencha os campos. Capa e ano serão buscados automaticamente caso fiquem em branco.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <datalist id="add-tipo-options">
            {availableTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div className="grid gap-2">
            <Label htmlFor="add-disco">Nome do álbum</Label>
            <Input
              id="add-disco"
              value={disco}
              onChange={(e) => setDisco(e.target.value)}
              placeholder="Ex: Transa"
              autoFocus
              required
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <div className="grid gap-2">
              <Label htmlFor="add-artista">Artista</Label>
              <Input
                id="add-artista"
                value={artista}
                onChange={(e) => setArtista(e.target.value)}
                placeholder="Ex: Caetano Veloso"
                required
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-ano">Ano</Label>
              <Input
                id="add-ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-tipo">Tipo</Label>
            <Input
              id="add-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              list="add-tipo-options"
              placeholder="disco, playlist, ..."
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-capa">URL da capa</Label>
            <Input
              id="add-capa"
              value={capa}
              onChange={(e) => setCapa(e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-spotify">URL do Spotify</Label>
            <Input
              id="add-spotify"
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/album/..."
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-yt">URL do YouTube Music</Label>
            <Input
              id="add-yt"
              value={yt}
              onChange={(e) => setYt(e.target.value)}
              placeholder="https://music.youtube.com/..."
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
