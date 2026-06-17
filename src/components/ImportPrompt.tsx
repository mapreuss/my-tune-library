import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileMusic, Sheet } from "lucide-react";
import { parseCSV, type Album } from "@/lib/csv";
import { ConnectSheetDialog } from "./ConnectSheetDialog";
import type { SheetConfig } from "@/lib/sheets";

type Props = {
  onLoad: (albums: Album[]) => void;
  onSheetConnected: (config: SheetConfig, albums: Album[]) => void;
};

export function ImportPrompt({ onLoad, onSheetConnected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const albums = parseCSV(text);
      if (albums.length === 0) {
        setError("Nenhum álbum encontrado no CSV. Verifique se há colunas Disco e Artista.");
        return;
      }
      onLoad(albums);
    } catch {
      setError("Não foi possível ler o arquivo.");
    }
  };

  const loadSample = async () => {
    setError(null);
    try {
      const res = await fetch("/sample-library.csv");
      const text = await res.text();
      onLoad(parseCSV(text));
    } catch {
      setError("Falha ao carregar a biblioteca de exemplo.");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-card text-primary shadow-soft">
        <FileMusic className="size-8" />
      </div>
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        Sua biblioteca musical
      </h1>
      <p className="mt-3 text-center text-muted-foreground">
        Importe um CSV ou conecte uma planilha do Google Sheets para começar.
      </p>

      <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex h-full cursor-pointer flex-col justify-center rounded-3xl border p-6 text-center transition-colors ${
            dragOver ? "border-primary bg-card" : "border-border bg-card/50"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mx-auto mb-3 size-8 text-primary" />
          <p className="font-medium">Arraste seu CSV aqui</p>
          <p className="mt-1 text-sm text-muted-foreground">ou clique para selecionar</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Colunas mínimas: <code>Disco, Artista</code>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex h-full flex-col justify-center rounded-3xl border border-border bg-card/50 p-6 text-center">
          <Sheet className="mx-auto mb-3 size-8 text-primary" />
          <p className="font-medium">Conectar planilha do Google Sheets</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Edições na biblioteca vão direto para a planilha — sempre sincronizadas.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            A planilha deve estar aberta e ter as colunas: Disco, Artista, Ano, Capa, Spotify, YouTubeMusic, Tipo.
          </p>
          <Button onClick={() => setSheetOpen(true)} className="mt-4 rounded-xl self-center">
            Conectar planilha
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={loadSample} className="rounded-xl">
          Usar biblioteca de exemplo
        </Button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <ConnectSheetDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onConnected={onSheetConnected}
      />
    </div>
  );
}

