import { checkedState } from '../../lib/validation.js';

const MAX = 24 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METADATA = 'id,document_type,str,product,defect,author,revision,created_at,updated_at';
const CONFLICT = 'Outra pessoa salvou uma versão mais recente. Seus dados continuam na tela. Mantenha esta aba aberta e consulte a versão atual em outra aba antes de continuar.';
const json = (body, status = 200) => Response.json(body, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
}});
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function backend(env) {
  const endpoint = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!endpoint || !key) throw new HttpError(503, 'A biblioteca ainda não foi configurada. Configure a conexão com o Supabase no Cloudflare.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new HttpError(503, 'O endereço do Supabase está inválido.');
  }
  if (!key.startsWith('sb_secret_') && !key.startsWith('eyJ')) throw new HttpError(503, 'Configure uma chave de servidor do Supabase.');
  const headers = { apikey: key };
  // New secret keys are API keys, not JWTs. Legacy service_role JWTs need Bearer too.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const base = url.origin;
  const bucket = env.SUPABASE_BUCKET || 'hqs-documents';
  if (!/^[a-z0-9-]{1,63}$/.test(bucket)) throw new HttpError(503, 'Nome de armazenamento inválido.');
  return {
    async request(route, options = {}) {
      return fetch(base + route, { ...options, headers: { ...headers, ...options.headers } });
    },
    objectPath(key) { return '/storage/v1/object/' + bucket + '/' + key.split('/').map(encodeURIComponent).join('/'); },
  };
}

async function result(response) {
  if (!response.ok) throw new HttpError(503, 'Não foi possível acessar os documentos no Supabase.');
  return response.json();
}

async function readBody(request) {
  const tooLarge = () => new HttpError(413, 'Reduza as fotos: o documento ultrapassa 24 MB.');
  if (Number(request.headers.get('Content-Length')) > MAX) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Documento vazio.');
  const decoder = new TextDecoder(); let length = 0, text = '';
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength;
      if (length > MAX) { await reader.cancel(); throw tooLarge(); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  let body;
  try { body = JSON.parse(text); checkedState(body?.state); }
  catch (error) { throw new HttpError(400, error instanceof SyntaxError ? 'Documento JSON inválido.' : error.message); }
  return body;
}

export async function onRequestGet({ request, env }) {
  try {
    const api = backend(env), url = new URL(request.url), id = url.searchParams.get('id');
    if (!id) {
      // Explicit pagination avoids silently hiding records after Supabase's default row limit.
      const documents = []; let offset = 0;
      while (true) {
        const rows = await result(await api.request(`/rest/v1/hqs_documents?select=${METADATA}&order=updated_at.desc,id.asc&limit=1000&offset=${offset}`));
        documents.push(...rows); if (rows.length < 1000) break; offset += rows.length;
      }
      return json({ documents });
    }
    if (!UUID.test(id)) throw new HttpError(400, 'Documento inválido.');
    const [doc] = await result(await api.request(`/rest/v1/hqs_documents?select=${METADATA}&id=eq.${id}`));
    if (!doc) throw new HttpError(404, 'Documento não encontrado.');
    if (url.searchParams.get('history') === '1') {
      const versions = []; let offset = 0;
      while (true) {
        const rows = await result(await api.request(`/rest/v1/hqs_revisions?select=version,author,note,created_at&document_id=eq.${id}&order=version.desc&limit=1000&offset=${offset}`));
        versions.push(...rows); if (rows.length < 1000) break; offset += rows.length;
      }
      return json({ document: doc, versions });
    }
    const requested = url.searchParams.get('version');
    const version = requested === null ? doc.revision : Number(requested);
    if (!Number.isSafeInteger(version) || version < 1) throw new HttpError(400, 'Versão inválida.');
    const [revision] = await result(await api.request(`/rest/v1/hqs_revisions?select=state_key&document_id=eq.${id}&version=eq.${version}`));
    if (!revision) throw new HttpError(404, 'Versão não encontrada.');
    const state = await result(await api.request(api.objectPath(revision.state_key)));
    return json({ document: doc, version, state });
  } catch (error) { return json({ error: error instanceof HttpError ? error.message : 'Não foi possível consultar os documentos. Tente novamente.' }, error.status || 503); }
}

export async function onRequestPost({ request, env }) {
  try {
    // Shared link access is retained from the original HQS library. Cloudflare Access
    // can protect the site and /api/* together without exposing the Supabase key.
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Origem não permitida.');
    if (request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new HttpError(403, 'Origem não permitida.');
    if (!request.headers.get('Content-Type')?.includes('application/json')) throw new HttpError(415, 'Envie um documento JSON.');
    const body = await readBody(request);
    const isNew = !body.id, id = isNew ? crypto.randomUUID() : body.id;
    if (typeof id !== 'string' || !UUID.test(id)) throw new HttpError(400, 'Documento inválido.');
    const expected = isNew ? 0 : body.expectedRevision;
    if (!Number.isSafeInteger(expected) || expected < 0 || expected >= 2147483647) throw new HttpError(400, 'Versão inválida.');
    const api = backend(env), version = expected + 1;
    const key = `documents/${id}/${version}-${crypto.randomUUID()}.json`;
    const stored = await api.request(api.objectPath(key), { method: 'POST', headers: {
      'Content-Type': 'application/json', 'x-upsert': 'false',
    }, body: JSON.stringify(body.state) });
    if (!stored.ok) throw new HttpError(503, 'Não foi possível guardar o documento e suas fotos. Tente novamente.');
    const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const meta = body.meta || {};
    const saved = await api.request('/rest/v1/rpc/hqs_save_document', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      p_id: id, p_expected: expected, p_document_type: body.state.documentType === 'IT' ? 'IT' : 'STR',
      p_str: text(meta.str, 120), p_product: text(meta.product, 300), p_defect: text(meta.defect, 2000),
      p_author: text(body.author, 120) || 'Não informado',
      p_note: text(body.note, 1000) || (isNew ? 'Criação do documento' : 'Atualização do documento'), p_state_key: key,
    }) });
    if (!saved.ok) {
      // Do not delete after an ambiguous timeout/server failure: the transaction may
      // have committed. A harmless orphan is preferable to a missing saved version.
      const failure = await saved.json().catch(() => ({}));
      if (failure.code === '40001' || failure.code === '23505') {
        await api.request('/storage/v1/object/' + (env.SUPABASE_BUCKET || 'hqs-documents'), {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [key] }),
        }).catch(() => {});
        throw new HttpError(409, CONFLICT);
      }
      throw new HttpError(503, 'Não foi possível confirmar o salvamento. Mantenha esta aba aberta e confira a biblioteca em outra aba antes de tentar novamente.');
    }
    return json(await saved.json(), isNew ? 201 : 200);
  } catch (error) { return json({ error: error instanceof HttpError ? error.message : 'Não foi possível salvar. Seus dados continuam na tela; tente novamente.' }, error.status || 503); }
}
