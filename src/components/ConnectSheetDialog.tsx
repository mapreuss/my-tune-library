import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { connectSheet, type SheetConfig } from "@/lib/sheets";
import type { Album } from "@/lib/csv";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onConnected: (config: SheetConfig, albums: Album[]) => void;
};

export function ConnectSheetDialog({ open, onOpenChange, initialUrl, onConnected }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl ?? "");
      setError(null);
      setBusy(false);
      try {
        setInIframe(window.self !== window.top);
      } catch {
        setInIframe(true);
      }
    }
  }, [open, initialUrl]);

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  const handleConnect = async () => {
    setError(null);
    setBusy(true);
    try {
      const { config, albums } = await connectSheet(url.trim());
      onConnected(config, albums);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao conectar.";
      setError(
        inIframe
          ? `${msg} — o Google costuma bloquear o login dentro do preview em iframe. Abra em uma nova aba.`
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar planilha do Google Sheets</DialogTitle>
          <DialogDescription>
            Cole a URL da planilha. Você precisará autorizar o acesso na conta Google que tem
            permissão de edição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Antes de conectar:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>A planilha deve estar <strong>aberta</strong> (sua, ou compartilhada com você como editor).</li>
              <li>
                A primeira aba é usada. A linha 1 precisa ser o cabeçalho com as colunas:
                <br />
                <code className="text-foreground">Disco, Artista, Ano, Capa, Spotify, YouTubeMusic, Tipo</code>
              </li>
              <li><code>Disco</code> e <code>Artista</code> são obrigatórias.</li>
            </ul>
          </div>

          <Input
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            className="rounded-xl"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleConnect} disabled={busy || !url.trim()} className="rounded-xl">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Conectando..." : "Conectar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
