import { useEffect, useRef, useState } from "react";
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
import { ExternalLink, RefreshCw, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Album } from "@/lib/csv";
import { spotifySearchUrl, youtubeMusicSearchUrl } from "@/lib/streaming";

type Props = {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (album: Album) => void;
  onRefetch: (album: Album) => Promise<void>;
  onEdit: (
    original: Album,
    changes: { disco: string; artista: string; ano?: string },
  ) => Album | null;
};

type EditField = "disco" | "artista" | "ano";

function EditableField({
  value,
  placeholder,
  className,
  inputClassName,
  ariaLabel,
  onSave,
}: {
  value: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value.trim()) onSave(trimmed);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className={cn("inline-flex items-center gap-1 align-middle", className)}>
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn("h-8 rounded-lg", inputClassName)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 rounded-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          aria-label="Confirmar"
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 rounded-lg"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          aria-label="Cancelar"
        >
          <X className="size-4" />
        </Button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Editar ${ariaLabel}`}
      className={cn(
        "group/edit inline-flex items-center gap-1.5 rounded-lg px-1 -mx-1 text-left hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className={cn(!value && "text-muted-foreground")}>
        {value || placeholder}
      </span>
      <Pencil className="size-3.5 opacity-0 transition-opacity group-hover/edit:opacity-60" />
    </button>
  );
}

export function AlbumDialog({
  album,
  open,
  onOpenChange,
  onDelete,
  onRefetch,
  onEdit,
}: Props) {
  const [refetching, setRefetching] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [current, setCurrent] = useState<Album | null>(album);

  useEffect(() => {
    setCurrent(album);
  }, [album]);

  if (!current) return null;

  const safeUrl = (url: string | undefined, fallback: string): string => {
    if (!url) return fallback;
    try {
      const { protocol } = new URL(url);
      return protocol === "https:" || protocol === "http:" ? url : fallback;
    } catch {
      return fallback;
    }
  };
  const spotify = safeUrl(current.spotify, spotifySearchUrl(current.artista, current.disco));
  const yt = safeUrl(current.youtubeMusic, youtubeMusicSearchUrl(current.artista, current.disco));

  const handleRefetch = async () => {
    setRefetching(true);
    try {
      await onRefetch(current);
    } finally {
      setRefetching(false);
    }
  };

  const handleFieldSave = (field: EditField, next: string) => {
    const changes = {
      disco: field === "disco" ? next : current.disco,
      artista: field === "artista" ? next : current.artista,
      ano: field === "ano" ? (next || undefined) : current.ano,
    };
    if (!changes.disco.trim() || !changes.artista.trim()) return;
    const updated = onEdit(current, changes);
    if (updated) setCurrent(updated);
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
          <DialogTitle asChild>
            <div className="text-2xl font-semibold leading-tight">
              <EditableField
                value={current.disco}
                ariaLabel="nome do álbum"
                placeholder="Nome do álbum"
                inputClassName="text-2xl font-semibold h-10"
                onSave={(v) => handleFieldSave("disco", v)}
              />
            </div>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              <EditableField
                value={current.artista}
                ariaLabel="artista"
                placeholder="Artista"
                onSave={(v) => handleFieldSave("artista", v)}
              />
              <span className="text-muted-foreground">·</span>
              <EditableField
                value={current.ano ?? ""}
                ariaLabel="ano"
                placeholder="Ano"
                inputClassName="w-24"
                onSave={(v) => handleFieldSave("ano", v)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
