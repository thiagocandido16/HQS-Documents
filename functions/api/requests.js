import {create,required} from '../../public/solicitacoes/model.js';
import {fullName,auditedEdit,auditedRevise,auditedDelete,restoreRecord} from '../../public/solicitacoes/audit.js';
import {updateControl,registerParameterization} from '../../public/solicitacoes/control.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function backend(env){
 if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)throw Error('Conexão compartilhada ainda não configurada.');
 const url=new URL(env.SUPABASE_URL);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username)throw Error('Configuração do banco inválida.');
 const key=env.SUPABASE_SECRET_KEY,headers={apikey:key,...(key.startsWith('eyJ')?{Authorization:`Bearer ${key}`}:{})};
 return async(route,options={})=>{const response=await fetch(url.origin+'/rest/v1/'+route,{...options,headers:{...headers,...options.headers}});const data=await response.json();if(!response.ok){const error=Error(data.code==='40001'?'Outra pessoa alterou este registro. Atualize a página antes de continuar.':data.code==='23505'?'Já existe um número ou vínculo para esta solicitação. Atualize a página.':'Não foi possível salvar no banco. Confira a lista antes de tentar novamente.');error.status=['40001','23505'].includes(data.code)?409:503;throw error;}return data;};
}
async function all(api,route){let rows=[],offset=0;while(true){const page=await api(route+`&limit=1000&offset=${offset}`);rows.push(...page);if(page.length<1000)return rows;offset+=page.length;}}
export async function onRequestGet({env,request}){try{
 const api=backend(env),id=request?new URL(request.url).searchParams.get('id'):null;
 if(id){if(!UUID.test(id))return json({error:'Identificador inválido.'},400);const [row]=await api(`hqs_requests?select=data,version&id=eq.${id}`);if(!row||row.data.deletedAt)return json({error:'Solicitação não encontrada.'},404);return json({record:{...row.data,serverVersion:row.version}});}
 const [rows,catalog,documents]=await Promise.all([all(api,'hqs_requests?select=data,version&order=updated_at.desc,id.asc'),all(api,'hqs_part_catalog?select=data&order=id.asc'),all(api,'hqs_documents?select=id,str,document_type,deleted_at&order=id.asc')]);
 return json({records:rows.map(r=>{const linked=documents.filter(d=>!d.deleted_at&&d.document_type===r.data.type&&d.str===r.data.number);return {...r.data,serverVersion:r.version,...(linked.length===1?{documentId:linked[0].id}:{})};}),catalog:catalog.map(r=>r.data),documents,mode:'shared'});
}catch(error){return json({error:error.message},error.status||503);}}
export function applyAction(body,record,at=new Date().toISOString()){
 const action=body.action,values=body.values||{};
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('Informações inválidas.');
 if(action==='create'||action==='convert'){
  const source=action==='convert'?record:null;if(source&&(source.type!=='IT'||source.deletedAt))throw Error('Selecione uma IT ativa.');
  const data=Object.fromEntries([...required,'squall'].map(key=>[key,source?source[key]:values[key]]));if(source)data.type='STR';
  for(const value of Object.values(data))if(value!==undefined&&(typeof value!=='string'||value.length>10000))throw Error('Campo inválido.');
  if(!['STR','IT'].includes(data.type))throw Error('Tipo de documento inválido.');
  fullName(data.responsible);const created=create(data,[],at);
  const timing=body.timing;if(timing&&Number.isFinite(timing.activeSeconds)&&Number.isFinite(timing.elapsedSeconds)&&timing.activeSeconds>=0&&timing.activeSeconds<=timing.elapsedSeconds&&timing.elapsedSeconds<=86400)created.timing={activeSeconds:timing.activeSeconds,elapsedSeconds:timing.elapsedSeconds,method:'interaction-gaps-under-60s-v1',phase:'number-request',identity:'self-reported-client-timing'};
  created.history[0]={kind:source?'STR criada a partir de IT':'Solicitação criada',actor:data.responsible,identity:'self-reported',reason:source?'Origem: '+source.number:'Número atribuído pelo servidor.',at};
  return {...created,id:body.id,...(source?{sourceRequestId:source.id,sourceNumber:source.number,control:source.control||{}}:{})};
 }
 if(!record)throw Error('Registro não encontrado.');
 if(action==='edit')return auditedEdit(record,values,body.actor,at);
 if(action==='control')return updateControl(record,values,body.actor,at);
 if(action==='parameterization')return registerParameterization(record,values.sentAt,body.actor,body.reason,at);
 if(action==='delete')return auditedDelete(record,body.reason,body.actor,at);
 if(action==='restore')return restoreRecord(record,body.reason,body.actor,at);
 if(action==='revise'){const next=auditedRevise(record,body.reason,body.actor,at);next.number=record.number.replace(/\.\d+$/,'')+'.'+next.revision;return next;}
 throw Error('Ação inválida.');
}
export async function onRequestPost({request,env}){try{
 const origin=new URL(request.url).origin;if((request.headers.get('Origin')&&request.headers.get('Origin')!==origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Origem não permitida.'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Envie informações JSON.'},415);
 const reader=request.body?.getReader();if(!reader)return json({error:'Solicitação vazia.'},400);let text='',bytes=0;const decoder=new TextDecoder();while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();return json({error:'Solicitação muito grande.'},413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
 let body;try{body=JSON.parse(text);}catch{return json({error:'JSON inválido.'},400);}
 if(!body||!UUID.test(body.id)||!Number.isSafeInteger(body.expected)||body.expected<0)return json({error:'Identificador ou versão inválidos.'},400);
 const api=backend(env);let record=null;
 if(body.action==='convert'){if(!UUID.test(body.sourceId))return json({error:'IT de origem inválida.'},400);const [row]=await api(`hqs_requests?select=data,version&id=eq.${body.sourceId}`);record=row?.data;if(!record)return json({error:'IT não encontrada.'},404);}
 else if(body.expected>0){const [row]=await api(`hqs_requests?select=data,version&id=eq.${body.id}`);if(!row)return json({error:'Registro não encontrado.'},404);if(row.version!==body.expected)return json({error:'O registro mudou. Atualize a página antes de continuar.'},409);record=row.data;}
 if((['create','convert'].includes(body.action))!==(body.expected===0))return json({error:'Ação e versão incompatíveis.'},400);
 let data;try{data=applyAction(body,record);}catch(error){return json({error:error.message},400);}
 const saved=await api('rpc/hqs_request_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_id:body.id,p_expected:body.expected,p_data:data})});return json(saved);
 }catch(error){return json({error:error.message||'Não foi possível concluir a ação.'},error.status||503);}}

