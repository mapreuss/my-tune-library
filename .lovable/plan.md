## Biblioteca Musical — App Front-end

Aplicação 100% client-side (sem backend, sem banco). Todos os dados ficam em `localStorage`. Visual claro e moderno em paleta Warm Sand (creme/areia/marrom suave) com cantos arredondados generosos.

### Fluxo principal

1. **Primeira abertura** — tela de boas-vindas pedindo upload do CSV (drag & drop ou seletor). Formato aceito: colunas `Disco,Artista` (mínimo). Após carregar, salva no `localStorage` e nunca mais pede.
2. **Enriquecimento automático** — para cada álbum sem capa/ano/links, consulta a iTunes Search API (`https://itunes.apple.com/search?term=...&entity=album&limit=1`) e preenche:
  - URL da capa (alta resolução, trocando `100x100` por `600x600`)
  - Ano de lançamento
  - Links de busca para Spotify (`https://open.spotify.com/search/Artista%20Album`) e YouTube Music (`https://music.youtube.com/search?q=Artista%20Album`)
   Progresso mostrado com barra discreta no topo. Resultados ficam em cache no `localStorage`.
3. **Galeria principal** — grid responsivo de cards com capa grande, título do álbum, artista e ano. Cantos arredondados (`rounded-2xl`), sombras suaves, hover com leve elevação. Álbuns sem capa mostram placeholder elegante com iniciais.
4. **Clique no card** — abre modal com capa ampliada, metadados e dois botões grandes: **Abrir no Spotify** e **Abrir no YouTube Music** (abrem em nova aba). Botão de excluir e botão de re-buscar metadados.

### Barra de ferramentas (topo)

- **Ordenar por**: Artista (A→Z, com álbuns do mesmo artista por ano crescente) | Álbum (A→Z)
- **Buscar**: filtro de texto rápido (artista ou álbum)
- **Adicionar álbum**: abre dialog pedindo só Artista e Nome — o resto é buscado na iTunes
- **Importar CSV**: substitui ou mescla com a biblioteca atual
- **Exportar CSV**: baixa CSV com colunas `Disco,Artista,Ano,Capa,Spotify,YouTubeMusic`

### Estrutura de rotas

- `/` — galeria (única rota necessária, modais para detalhes/adicionar)

### Detalhes técnicos

- **Stack**: TanStack Start + React + Tailwind v4 + shadcn/ui (Dialog, Button, Input, Select, Sonner para toasts).
- **Storage key**: `music-library-v1` com array de objetos `{ disco, artista, ano?, capa?, spotify?, youtubeMusic?, enriched: boolean }`.
- **CSV**: parser/serializer próprio leve (lida com vírgulas dentro de aspas — caso "Whatever People Say I Am, That's What I'm Not"). Sem dependência extra.
- **iTunes API**: chamadas diretas do browser (CORS habilitado pela Apple). Throttle simples (ex: 4 requests paralelos) para não saturar. Falhas silenciosas — álbum fica marcado como "não enriquecido" e pode ser re-tentado.
- **Ordenação por artista**: agrupa por artista (A→Z, locale `pt-BR`, ignora acentos), dentro do grupo ordena por ano crescente; álbuns sem ano vão ao final do grupo.
- **Adicionar álbum**: insere no estado, dispara enriquecimento imediato, persiste.

### Layout/visual

```text
┌─────────────────────────────────────────────────┐
│  Biblioteca   [busca]  [ordenar▾] [+] [↓CSV] │
├─────────────────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │CAPA│ │CAPA│ │CAPA│ │CAPA│ │CAPA│           │
│  └────┘ └────┘ └────┘ └────┘ └────┘           │
│  Album   Album   Album   Album   Album         │
│  Artista Artista Artista Artista Artista       │
└─────────────────────────────────────────────────┘
```

- Background `#faf8f5`, cards `#f0ebe3`, accent `#8b7355`, texto escuro suave.
- Tipografia: sans-serif moderna (Inter ou similar do sistema).
- Cards quadrados com capa em `aspect-square`, cantos `rounded-2xl`.
- Modal com cantos `rounded-3xl`, capa grande à esquerda, ações à direita.

### Entregáveis

- `src/routes/index.tsx` — galeria + toolbar
- `src/components/AlbumCard.tsx`, `AlbumDialog.tsx`, `AddAlbumDialog.tsx`, `ImportPrompt.tsx`
- `src/lib/csv.ts` — parse/serialize
- `src/lib/itunes.ts` — busca de metadados
- `src/lib/storage.ts` — wrapper localStorage
- `src/lib/streaming.ts` — geração das URLs de busca
- CSV inicial do usuário pré-carregado opcionalmente via botão "Usar exemplo" na tela de boas-vindas.