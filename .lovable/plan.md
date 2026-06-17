## Objetivo
Criar uma página de política de privacidade acessível em `/politica-de-privacidade`, exigida pelo Google para verificação do OAuth, sem link em nenhum menu da aplicação.

## Mudanças

### Novo arquivo: `src/routes/politica-de-privacidade.tsx`
- Rota TanStack com `createFileRoute("/politica-de-privacidade")`.
- `head()` com title e meta description próprios + `<meta name="robots" content="noindex">` (página utilitária, não precisa ser indexada).
- Conteúdo em português, em HTML semântico (H1 único, seções com H2), legível e centralizado, usando os tokens do design system existente.

### Conteúdo da página (resumo das seções)
1. **Introdução** — nome do app e finalidade (catálogo musical pessoal que pode se conectar a uma planilha do Google Sheets do próprio usuário).
2. **Quais dados acessamos** — quando o usuário autoriza via Google OAuth, o app solicita acesso apenas à(s) planilha(s) do Google Sheets que ele escolher abrir na ferramenta.
3. **Como os dados são usados** — exclusivamente no navegador do usuário, para listar, adicionar, editar e remover linhas da planilha conectada. A conexão serve apenas para que o usuário consiga visualizar e gerenciar a planilha compartilhada dentro da ferramenta.
4. **O que NÃO fazemos** — os dados da planilha e da conta Google **não são expostos ao desenvolvedor**, não são armazenados em servidores próprios, não são compartilhados com terceiros, não são usados para treinar modelos nem para publicidade.
5. **Armazenamento local** — apenas a URL da planilha conectada e o token de acesso temporário ficam no navegador do usuário (localStorage/sessionStorage) e podem ser removidos a qualquer momento em "Ferramentas → Desconectar planilha".
6. **Revogação de acesso** — instruções para revogar pelo próprio app e pela página de permissões da conta Google (`myaccount.google.com/permissions`).
7. **Contato** — espaço placeholder para e-mail de contato (a preencher pelo usuário depois).
8. **Data da última atualização**.

### Não muda
- Nenhum link novo em header, footer, menu "Ferramentas" ou em qualquer outro lugar da UI.
- A rota fica acessível apenas por URL direta (que é o suficiente para colar no console do Google Cloud).
- `routeTree.gen.ts` é regenerado automaticamente pelo plugin do TanStack — não editado manualmente.

## Pergunta opcional
Quer que eu já deixe um e-mail de contato preenchido (qual?) ou mantenho como placeholder `[seu e-mail aqui]` para você editar depois?
