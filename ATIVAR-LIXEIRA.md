# Ativar a lixeira no HQS Documents

Esta atualização usa o projeto existente do HQS Documents. Não usa nem altera o banco do HQS Solicitações.

1. No SQL Editor do projeto HQS Documents, executar o conteúdo completo de `supabase/002_document_trash.sql`. A migração adiciona campos e histórico; não apaga documentos, fotos ou versões.
2. Publicar o código atualizado no Cloudflare Pages.
3. No projeto Cloudflare hqs-documents, configurar a variável de texto `HQS_TRASH_ENABLED` com o valor `true` no ambiente Production e publicar novamente.
4. Usar um documento fictício para testar exclusão, histórico, visualização na lixeira e restauração. Conferir fotos e versões após restaurar.

Antes da ativação, a biblioteca e o salvamento existentes continuam funcionando e o botão da lixeira permanece desativado. Não habilitar a variável antes de executar a migração. Depois de usar a lixeira, manter a variável ativada para que documentos excluídos permaneçam separados da biblioteca.

Nome e sobrenome são informados pela pessoa, sem verificação por login. São obrigatórios nas ações e nos novos salvamentos quando a lixeira estiver ativada. Exclusão e restauração exigem motivo, gravado no histórico na mesma transação. A atualização verifica a versão e a data de alteração para rejeitar ações sobre dados desatualizados.

O conteúdo e as versões ficam preservados; não existe exclusão definitiva por esta interface. Salvar uma aba antiga de um documento excluído é rejeitado pelo banco. O recurso não reduz o armazenamento utilizado.

Validação local: testes da API com servidor Supabase simulado, incluindo conservação de fotos e versões, conflitos, nomes incompletos, motivos vazios, exclusão e restauração. A execução real da migração e a verificação no ambiente online ainda são necessárias.

## Verificação em produção — 18/11/2026

Migração aplicada no projeto HQS Documents e variável ativada no Cloudflare. Teste online concluído com documento fictício TESTE-LIXEIRA-20261118: exclusão, retorno HTTP 410 ao abrir, listagem na lixeira, histórico com responsável e motivo, restauração integral da foto/estado e conservação da versão 1. O documento fictício foi novamente excluído e permanece recuperável na lixeira. Os dois documentos preexistentes não foram alterados.
