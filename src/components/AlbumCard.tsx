import { useState } from "react";
import type { Album } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Props = {
  album: Album;
  onClick: () => void;
};

function initials(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AlbumCard({ album, onClick }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showImg = album.capa && !errored;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-card shadow-card transition-all",
          "group-hover:shadow-card-hover group-hover:-translate-y-0.5",
        )}
      >
        {showImg ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
            )}
            <img
              src={album.capa}
              alt={`Capa de ${album.disco}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-card text-primary">
            <span className="text-3xl font-semibold tracking-wide">
              {initials(album.disco || album.artista || "?")}
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-foreground">
          {album.disco}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {album.artista}
          {album.ano ? ` · ${album.ano}` : ""}
        </p>
      </div>
    </button>
  );
}
