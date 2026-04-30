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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (artista: string, disco: string) => void;
};

export function AddAlbumDialog({ open, onOpenChange, onAdd }: Props) {
  const [artista, setArtista] = useState("");
  const [disco, setDisco] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = artista.trim();
    const d = disco.trim();
    if (!a || !d) return;
    onAdd(a, d);
    setArtista("");
    setDisco("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar álbum</DialogTitle>
          <DialogDescription>
            Informe artista e nome do álbum. As capas, ano e links serão buscados automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artista">Artista</Label>
            <Input
              id="artista"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              placeholder="Ex: Caetano Veloso"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disco">Álbum</Label>
            <Input
              id="disco"
              value={disco}
              onChange={(e) => setDisco(e.target.value)}
              placeholder="Ex: Transa"
              required
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
