# HQS Documents — Cloudflare + Supabase

Editor completo STR e IT, com biblioteca compartilhada, versões, seis fotos por página STR, páginas adicionais, lista de presença e folha de EPIs ao final. A impressão usa as folhas HTML do próprio editor e pode salvar o documento inteiro como PDF pelo navegador.

Esta versão preserva o acesso compartilhado pelo link escolhido para o sistema original: quem consegue acessar o site pode consultar e editar documentos. Não há login próprio nem identidade verificada do autor; o nome informado no salvamento é declaratório. Se quiser restringir o site à empresa, proteja o endereço **e /api/** com Cloudflare Access antes do uso. O banco e o bucket não têm acesso público direto: somente o servidor Cloudflare usa a chave secreta.

## 1. Supabase

1. Crie o projeto HQS Documents no painel Supabase. Guarde a senha do banco.
2. Abra SQL Editor, crie uma consulta e execute todo o arquivo `supabase/001_hqs.sql`.
3. A consulta cria `hqs_documents`, `hqs_revisions`, a função de salvamento transacional e o bucket privado `hqs-documents`. Os snapshots completos, incluindo fotos, ficam no Storage; as tabelas guardam metadados e histórico.
4. Copie a URL do projeto e uma chave **Secret** de servidor na área de API Keys. A chave legacy **service_role** também é aceita. **Não use publishable/anon** nesse campo.
5. Não envie chaves por chat, não coloque em arquivos públicos e não faça commit delas.

## 2. Cloudflare Pages conectado ao GitHub

No painel Cloudflare, use Workers & Pages → Create application → Pages → Connect to Git (os nomes podem variar). Selecione `thiagocandido16/HQS-Documents` e a branch com esta migração.

| Campo | Valor |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `public` |
| Root directory | raiz do repositório |
| Node version, se necessário | `22` |

Configure as variáveis de execução do projeto:

| Nome | Valor | Tratamento |
|---|---|---|
| `SUPABASE_URL` | URL HTTPS do seu projeto | Variável |
| `SUPABASE_SECRET_KEY` | Chave Secret ou legacy service_role | **Secret** |
| `SUPABASE_BUCKET` | `hqs-documents` | Variável, opcional |

Configure no ambiente Production e também Preview caso teste uma branch de prévia. Refaça o deployment após mudar variáveis. O site pode abrir sem a conexão, mas salvar e listar documentos exigem essas configurações e o SQL executado. As funções devem ser compiladas a partir da pasta `functions`, que fica na raiz, fora de `public`. Não use um simples upload dos arquivos públicos: isso não instala o servidor da biblioteca.

O nome público depende da disponibilidade no Cloudflare (ex.: um nome escolhido terminado em `.pages.dev`). Nenhum link final foi reservado por este código.

## 3. Conferência antes do uso

- Criar uma STR, preencher campos e incluir fotos por anexo e Ctrl+V.
- Adicionar e excluir uma página de operação; conferir cabeçalhos e defeito editável.
- Salvar, atualizar a página e reabrir. Conferir campos, fotos e EPIs.
- Salvar uma alteração, abrir Versões e consultar a versão anterior.
- Abrir a mesma versão em duas abas. A segunda gravação deve avisar conflito, sem sobrescrever a primeira.
- Criar IT e repetir salvar/reabrir, com fotos e presença.
- Imprimir/Salvar PDF e conferir todas as folhas A4, fotos e EPIs por último.
- Conferir permissões e administração das contas com os responsáveis do setor.

## Código e verificações

`npm install`, `npm test`, `npm run build`. Para desenvolvimento local, coloque as variáveis em `.dev.vars` (ignorado pelo Git) e use `npm run dev`. Os testes de API simulam Supabase e verificam o contrato, inclusive conflitos; não substituem um teste com um projeto real. Testes locais de banco podem ser executados com PostgreSQL de teste, nunca no projeto de produção.

O limite por snapshot é 24 MiB. Fotos e snapshots antigos contam no armazenamento do projeto. Revisões são preservadas; a aplicação não exclui documentos ou versões. Em caso raro de falha de rede após a gravação, confira a biblioteca antes de repetir: o servidor evita apagar um snapshot cujo commit pode ter ocorrido. Arquivos órfãos desse caso podem precisar de revisão administrativa posterior.

## Importante sobre migração

Este repositório traz o editor e uma **biblioteca nova**. Documentos que estejam salvos no site antigo não são transferidos automaticamente. Antes da troca definitiva, exporte os documentos existentes e planeje a importação. A interface não oferece importação/exportação de cópias locais. Documentos antigos precisam de uma migração administrativa separada. Guarde uma cópia de segurança.

Os arquivos `public/index.html` e `public/editor.html` são cópias equivalentes, para manter os endereços antigos. Os botões de salvamento usam `/api/documents`; a chave Supabase nunca é colocada no navegador. Este pacote não depende de ChatGPT, do runtime Sites, de Next.js ou de Power Apps.
