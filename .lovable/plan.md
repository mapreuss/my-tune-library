# Conectar planilha do Google Sheets (além do CSV)

## Visão geral

Adicionar uma segunda forma de carregar a biblioteca: conectar uma planilha do Google Sheets que tenha as mesmas colunas do CSV (`Disco, Artista, Ano, Capa, Spotify, YouTubeMusic, Tipo`). Quando uma planilha está conectada:

- A view lê os álbuns direto da planilha (não usa `localStorage` para os dados).
- Adicionar / editar / excluir álbuns chama a API do Google Sheets e atualiza a planilha.
- Após cada operação, a view recarrega da planilha — planilha e UI sempre sincronizadas.
- A URL da planilha + token OAuth ficam salvos no `localStorage` (só a configuração, não os dados).
- Em "Ferramentas" há um modal para alterar a URL ou desconectar a planilha.

O fluxo de CSV continua exatamente como está.

## O que você precisa configurar no Google Cloud

Antes de eu poder implementar, você precisa criar uma credencial OAuth:

1. Vá em https://console.cloud.google.com → crie um projeto (ou use um existente).
2. **APIs & Services → Library** → habilite **Google Sheets API**.
3. **APIs & Services → OAuth consent screen** → tipo **External** → preencha nome do app, e-mail, escopo `https://www.googleapis.com/auth/spreadsheets` → adicione seu e-mail como usuário de teste.
4. **APIs & Services → Credentials → Create credentials → OAuth Client ID** → tipo **Web application**.
   - Em **Authorized JavaScript origins**, adicione:
     - `https://my-tune-library.lovable.app`
     - `https://id-preview--42957bd3-0a17-4caa-87c4-d8d019ff53b0.lovable.app`
     - `http://localhost:5173` (opcional, dev local)
5. Anote o **Client ID** (público, vai no código) — não precisa do Client Secret para esse fluxo (usaremos OAuth implícito/token client do GIS, que roda 100% no browser).

Depois disso vou te pedir só o **Client ID** via secret (`GOOGLE_OAUTH_CLIENT_ID`) — apesar de ser público, fica mais limpo guardar como segredo para você poder rotacionar.

## Fluxo do usuário

### Tela inicial (sem nada conectado)
A `ImportPrompt` ganha um segundo bloco abaixo do drag-and-drop do CSV:

- **"Conectar planilha do Google Sheets"** com um botão "Conectar planilha".
- Texto explicativo: *"A planilha precisa estar aberta (compartilhada ou sua), e conter as colunas: Disco, Artista, Ano, Capa, Spotify, YouTubeMusic, Tipo (a primeira linha é o cabeçalho)."*
- Ao clicar:
  1. Pede a URL da planilha (input em modal).
  2. Dispara o consentimento OAuth do Google (popup do Google Identity Services).
  3. Valida que consegue ler a aba e que as colunas existem.
  4. Salva config + carrega álbuns da planilha.

### Modo "Planilha conectada"
- Quando há planilha conectada, a página principal lê e escreve direto nela.
- Header indica "Conectado a: <nome da planilha>" com um botão de refresh.
- O botão **Ferramentas** abre um menu/modal com:
  - "Alterar URL da planilha" (re-valida e reconecta).
  - "Desconectar planilha" (remove config local, volta pra tela inicial).
  - As ferramentas existentes (exportar, etc.) continuam funcionando.

### Add / Edit / Delete com planilha conectada
- **Add**: `append` na planilha → recarrega.
- **Edit**: encontra a linha pelo índice → `values.update` no range específico → recarrega.
- **Delete**: `batchUpdate` com `deleteDimension` (linha) → recarrega.
- Em caso de erro (token expirado), tenta renovar silenciosamente; se falhar, pede consentimento de novo.

## Detalhes técnicos

### Autenticação
Usar **Google Identity Services (GIS) Token Client** no browser:
- Script: `https://accounts.google.com/gsi/client`
- Escopo: `https://www.googleapis.com/auth/spreadsheets`
- Fluxo: `google.accounts.oauth2.initTokenClient({ client_id, scope, callback })`.
- Token de acesso (1h) guardado em memória; ao expirar, re-solicita silenciosamente com `prompt: ''`.
- O Client ID vem de `import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID` (vou expor o secret com prefixo `VITE_` por ser público).

### API calls
Chamadas REST diretas do browser (sem server function necessário):
- Ler: `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/A1:G10000` com `Authorization: Bearer {token}`.
- Append: `POST .../values/A1:append?valueInputOption=USER_ENTERED`.
- Update linha: `PUT .../values/A{row}:G{row}?valueInputOption=USER_ENTERED`.
- Delete linha: `POST .../{id}:batchUpdate` com `deleteDimension`.
- Metadata (nome da planilha + sheetId da primeira aba): `GET .../{id}?fields=properties.title,sheets.properties`.

### Parsing
Reaproveitar a lógica de mapeamento de colunas que já existe em `parseCSV` — extrair pra função compartilhada `mapRowsToAlbums(headerRow, dataRows)` em `src/lib/csv.ts`. Usada tanto pelo CSV quanto pelo Sheets.

### Estado e armazenamento
Novo módulo `src/lib/sheets.ts`:
- `loadSheetConfig() / saveSheetConfig() / clearSheetConfig()` — guarda `{ spreadsheetId, sheetTitle, sheetId, url }` em `localStorage` (chave `music-library-sheet-v1`).
- `fetchAlbumsFromSheet()`, `appendAlbum()`, `updateAlbumAt(rowIndex, album)`, `deleteAlbumAt(rowIndex)`.
- `connectSheet(url)` valida URL, autoriza, lê metadata, valida colunas mínimas (Disco + Artista).

Novo hook `src/hooks/useLibrarySource.ts`:
- Retorna `{ source: 'csv' | 'sheet' | 'none', albums, isLoading, add, update, remove, refresh, disconnect }`.
- Em `csv`: opera em `localStorage` (comportamento atual).
- Em `sheet`: opera via API; cada mutação re-busca a planilha.

`src/routes/index.tsx` passa a usar esse hook em vez de tocar `loadLibrary/saveLibrary` direto. Os componentes `AlbumDialog`, `AddAlbumDialog`, etc., não mudam — recebem callbacks normais.

### UI nova
- `src/components/ConnectSheetDialog.tsx` — modal de conectar/alterar URL, com instruções sobre colunas e compartilhamento.
- `src/components/ToolsMenu.tsx` (ou estender o existente) — adicionar itens "Gerenciar planilha" e "Desconectar".
- Pequeno indicador no header quando há planilha conectada.

### Arquivos a criar
- `src/lib/sheets.ts`
- `src/lib/google-auth.ts` (carrega script GIS, gerencia token)
- `src/hooks/useLibrarySource.ts`
- `src/components/ConnectSheetDialog.tsx`

### Arquivos a modificar
- `src/lib/csv.ts` (extrair `mapRowsToAlbums`)
- `src/components/ImportPrompt.tsx` (adicionar bloco de Sheets)
- `src/routes/index.tsx` (usar `useLibrarySource`, abrir modal de gerenciar planilha)
- `src/routes/__root.tsx` (carregar script `gsi/client` via `<script>` no head)

### Segredo necessário
- `GOOGLE_OAUTH_CLIENT_ID` (vou expor como `VITE_GOOGLE_OAUTH_CLIENT_ID` no código pois Client ID OAuth é público).

## Limitações honestas
- O token OAuth vive só na aba atual (1h). Quando expira, abre um popup silencioso pra renovar — se o navegador bloquear, pede um clique.
- Funciona apenas com planilhas onde o usuário logado tem permissão de edição.
- A primeira aba da planilha é usada por padrão (posso permitir escolher se quiser numa próxima iteração).

Aprovando o plano, eu já implemento e te peço o `GOOGLE_OAUTH_CLIENT_ID` via formulário seguro.