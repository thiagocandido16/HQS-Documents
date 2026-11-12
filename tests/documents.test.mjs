import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/documents.js';

const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_TEST_ONLY',SUPABASE_BUCKET:'hqs-documents'};
const id='7c0a2d45-c681-44aa-9af0-cc9e7b45b3b1';
const state=()=>({schema:2,documentType:'STR',fields:[{key:'legacy:0',value:'STR-TESTE',checked:false}],operations:[{manuals:[],defectEdited:false,steps:Array.from({length:3},()=>({description:'Inspecionar',photos:[{src:'data:image/png;base64,YWJj',size:100},{src:'',size:100}]}))}],training:[]});
const payload=(extra={})=>({state:state(),meta:{str:'STR-TESTE',product:'Peça',defect:'Defeito'},author:'Equipe',...extra});
const post=(body,headers={})=>({env,request:new Request('https://hqs.pages.dev/api/documents',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://hqs.pages.dev',...headers},body:JSON.stringify(body)})});
const get=query=>({env,request:new Request('https://hqs.pages.dev/api/documents'+query)});
const response=(body,status=200)=>Response.json(body,{status});
function fakeSupabase(){
 const docs=new Map(),revisions=[],objects=new Map(),calls=[];
 return {docs,revisions,objects,calls,async fetch(url,options={}){
  calls.push({url,options});assert.equal(new URL(url).origin,env.SUPABASE_URL);
  assert.equal(options.headers.apikey,env.SUPABASE_SECRET_KEY);assert(!options.headers.Authorization);
  const u=new URL(url),body=options.body?JSON.parse(options.body):null;
  const objectPrefix='/storage/v1/object/hqs-documents/';
  if(u.pathname.startsWith(objectPrefix)){
    const key=u.pathname.slice(objectPrefix.length);
    if(options.method==='POST'){assert(!objects.has(key));objects.set(key,body);return response({Key:key});}
    return objects.has(key)?response(objects.get(key)):response({},404);
  }
  if(u.pathname==='/storage/v1/object/hqs-documents'&&options.method==='DELETE'){
    for(const key of body.prefixes)objects.delete(key);return response([]);
  }
  if(u.pathname==='/rest/v1/rpc/hqs_save_document'){
    const existing=docs.get(body.p_id);
    if((body.p_expected===0&&existing)||(body.p_expected>0&&(!existing||existing.revision!==body.p_expected||existing.document_type!==body.p_document_type)))return response({code:'40001'},400);
    const doc={id:body.p_id,document_type:body.p_document_type,str:body.p_str,product:body.p_product,defect:body.p_defect,author:body.p_author,revision:body.p_expected+1,updated_at:new Date().toISOString()};
    docs.set(doc.id,doc);revisions.push({document_id:doc.id,version:doc.revision,state_key:body.p_state_key,author:body.p_author,note:body.p_note,created_at:doc.updated_at});
    return response({id:doc.id,revision:doc.revision,updated_at:doc.updated_at});
  }
  if(u.pathname==='/rest/v1/hqs_documents'){
    const chosen=u.searchParams.get('id');const rows=[...docs.values()].filter(d=>!chosen||d.id===chosen.slice(3));
    return response(rows.slice(Number(u.searchParams.get('offset')||0),Number(u.searchParams.get('offset')||0)+1000));
  }
  if(u.pathname==='/rest/v1/hqs_revisions')return response(revisions.filter(r=>r.document_id===u.searchParams.get('document_id').slice(3)&&(!u.searchParams.has('version')||r.version===Number(u.searchParams.get('version').slice(3)))).sort((a,b)=>b.version-a.version));
  throw Error('Unexpected endpoint '+url);
 }};
}
async function withBackend(run){const saved=globalThis.fetch,backend=fakeSupabase();globalThis.fetch=backend.fetch;try{await run(backend);}finally{globalThis.fetch=saved;}}

test('save, reopen, list, update and restore a previous STR with photos',async()=>withBackend(async b=>{
 const created=await onRequestPost(post(payload()));assert.equal(created.status,201);const saved=await created.json();assert.equal(saved.revision,1);assert.equal(b.objects.size,1);
 let opened=await onRequestGet(get('?id='+saved.id));assert.deepEqual((await opened.json()).state,state());
 assert.equal((await (await onRequestGet(get(''))).json()).documents.length,1);
 const update=payload({id:saved.id,expectedRevision:1});update.state.fields[0].value='Atualizada';
 assert.equal((await onRequestPost(post(update))).status,200);
 const old=await (await onRequestGet(get('?id='+saved.id+'&version=1'))).json();assert.equal(old.state.fields[0].value,'STR-TESTE');
 const history=await (await onRequestGet(get('?id='+saved.id+'&history=1'))).json();assert.equal(history.versions.length,2);
}));
test('simultaneous edits reject the stale version and remove only its orphan snapshot',async()=>withBackend(async b=>{
 const saved=await (await onRequestPost(post(payload()))).json();
 const results=await Promise.all([onRequestPost(post(payload({id:saved.id,expectedRevision:1}))),onRequestPost(post(payload({id:saved.id,expectedRevision:1})))]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(b.revisions.length,2);assert.equal(b.objects.size,2);
}));
test('invalid JSON, unsupported images, duplicate fields and oversized input do not reach Supabase',async()=>withBackend(async b=>{
 const invalid=payload();invalid.state.operations[0].steps[0].photos[0].src='https://unsafe.invalid/photo.png';assert.equal((await onRequestPost(post(invalid))).status,400);
 const duplicate=payload();duplicate.state.fields.push({...duplicate.state.fields[0]});assert.equal((await onRequestPost(post(duplicate))).status,400);
 const bad=post(payload());bad.request=new Request(bad.request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal((await onRequestPost(bad)).status,400);
 assert.equal((await onRequestPost(post(payload(),{'Content-Length':String(25*1024*1024)}))).status,413);assert.equal(b.calls.length,0);
}));
test('invalid document ids, unsupported content types and cross-origin writes are rejected',async()=>withBackend(async b=>{
 assert.equal((await onRequestGet(get('?id=invalid'))).status,400);
 assert.equal((await onRequestPost(post(payload(),{Origin:'https://other.invalid'}))).status,403);
 assert.equal((await onRequestPost(post(payload(),{'Content-Type':'text/plain'}))).status,415);
 assert.equal(b.calls.length,0);
}));
test('missing configuration returns actionable message without leaking secrets',async()=>{
 const r=await onRequestGet({request:get('').request,env:{}});assert.equal(r.status,503);assert.match((await r.json()).error,/configurada/);
});
test('valid IT schema and PPE can be saved and reopened without changing the format',async()=>withBackend(async()=>{
 const keys=['number','reference','part','motor','csrYes','csrNo','technicalDefect','strDefect','markPilot','markIndustrial','markLabel','markOther','markOtherText','containment','containmentDetails','sampling','samplingDetails','rework','parameterization','start','costCenter','requester','area'];
 const it={schema:1,documentType:'IT',fields:Object.fromEntries(keys.map(k=>[k,{value:'',checked:false}])),instructions:[Array.from({length:4},()=>({description:'Etapa',photo:{src:'',size:100}}))],training:Array.from({length:20},()=>({name:'',shift:''})),ppe:{schema:1,fixed:Array(24).fill(false),additional:Array.from({length:10},()=>({name:'',checked:false})),sites:{CVP:false,CMO:false,CVU:false},sector:'',technician:'',qualification:'',registration:''}};
 const saved=await (await onRequestPost(post(payload({state:it})))).json();assert(saved.id);
 assert.deepEqual((await (await onRequestGet(get('?id='+saved.id))).json()).state,it);
}));
test('missing documents and versions return 404',async()=>withBackend(async()=>{
 assert.equal((await onRequestGet(get('?id='+id))).status,404);
 const saved=await (await onRequestPost(post(payload()))).json();assert.equal((await onRequestGet(get('?id='+saved.id+'&version=99'))).status,404);
}));
test('ambiguous RPC failure preserves stored snapshot and returns a recoverable error',async()=>withBackend(async b=>{
 const normal=globalThis.fetch;globalThis.fetch=async(url,options)=>url.endsWith('/rpc/hqs_save_document')?response({},504):normal(url,options);
 const r=await onRequestPost(post(payload()));assert.equal(r.status,503);assert.equal(b.objects.size,1);assert.match((await r.json()).error,/confirmar/);
}));
