# Validação da migração

Preparado em 12/11/2026.

- Editor e folhas copiados da versão completa STR/IT desenvolvida anteriormente.
- JavaScript de todos os módulos e referências locais dos dois HTMLs conferidos.
- Oito testes de API passaram: salvar/listar/reabrir, fotos no snapshot, histórico, concorrência, validação, configuração ausente, IT e EPIs, inexistência e falha ambígua.
- Servidor Pages Functions compilado com Wrangler 4.92.0.
- Não foram usadas credenciais reais nem criados registros em serviços externos nesses testes.

Ainda pendente: executar o SQL e testar com um projeto real Supabase; conferir a prévia do Cloudflare, importação de cópia, fotos e PDF impresso de STR/IT. O navegador de prévia não alcançou o servidor local, por isso não houve nova verificação visual ao vivo nesta migração. A compilação não confirma que o projeto Supabase foi configurado.

Este código não reserva endereço nem provisiona contas. O site anterior e os documentos antigos continuam separados até a migração dos arquivos.
