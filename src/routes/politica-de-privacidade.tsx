import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — My Tune Library" },
      {
        name: "description",
        content:
          "Como o My Tune Library usa o acesso à sua planilha do Google Sheets. Seus dados não são expostos ao desenvolvedor.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Política de Privacidade — My Tune Library" },
      {
        property: "og:description",
        content:
          "Como o My Tune Library usa o acesso à sua planilha do Google Sheets.",
      },
      {
        property: "og:url",
        content: "https://my-tune-library.lovable.app/politica-de-privacidade",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://my-tune-library.lovable.app/politica-de-privacidade",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: 17 de junho de 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">1. Sobre o aplicativo</h2>
          <p>
            O <strong>My Tune Library</strong> é um catálogo musical pessoal que
            roda inteiramente no navegador. Ele permite que você importe um
            arquivo CSV local ou, opcionalmente, conecte uma planilha do{" "}
            <em>Google Sheets</em> de sua propriedade para visualizar, adicionar,
            editar e remover álbuns diretamente nela.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">
            2. Quais dados acessamos
          </h2>
          <p>
            Quando você autoriza o acesso via login do Google (OAuth), o
            aplicativo solicita permissão apenas para ler e escrever na(s)
            planilha(s) que você decidir conectar à ferramenta. Não acessamos
            outras planilhas, arquivos do Drive, e-mails, contatos, fotos ou
            qualquer outro dado da sua conta Google.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">
            3. Como os dados são usados
          </h2>
          <p>
            Os dados da planilha conectada são utilizados exclusivamente no seu
            próprio navegador, para exibir e gerenciar sua biblioteca musical
            dentro da ferramenta. A conexão com o Google serve apenas para que{" "}
            <strong>você consiga ver e editar a planilha compartilhada dentro
            do aplicativo</strong>. Nenhuma informação é transmitida para
            servidores do desenvolvedor.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">
            4. O que não fazemos
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Os dados da sua planilha e da sua conta Google não são
              expostos ao desenvolvedor</strong>.
            </li>
            <li>Não armazenamos seus dados em servidores próprios.</li>
            <li>Não compartilhamos seus dados com terceiros.</li>
            <li>Não usamos seus dados para publicidade.</li>
            <li>Não usamos seus dados para treinar modelos de IA.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">
            5. Armazenamento local
          </h2>
          <p>
            Para manter a sua conexão funcionando entre sessões, o aplicativo
            guarda no <em>localStorage</em> e/ou <em>sessionStorage</em> do seu
            navegador apenas: a URL da planilha conectada e o token de acesso
            temporário emitido pelo Google. Esses dados nunca saem do seu
            dispositivo e podem ser removidos a qualquer momento em{" "}
            <strong>Ferramentas → Desconectar planilha</strong>, ou ao limpar os
            dados do site no seu navegador.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">
            6. Revogação de acesso
          </h2>
          <p>
            Você pode desconectar a planilha a qualquer momento pelo menu{" "}
            <strong>Ferramentas</strong> do próprio aplicativo. Para revogar a
            permissão concedida à conta Google, acesse{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              myaccount.google.com/permissions
            </a>{" "}
            e remova o My Tune Library da lista de aplicativos conectados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mt-8 mb-3">7. Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política, entre em contato pelo
            e-mail: <code>marta.preuss@gmail.com</code>.
          </p>
        </section>
      </article>
    </main>
  );
}
