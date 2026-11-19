import {edit,revise,deleteRecord} from './model.js';
export function fullName(value){
 const name=String(value??'').trim().replace(/\s+/g,' ');
 if(name.length>200||!/^\p{L}[\p{L}\p{M}'’.-]*(?: [\p{L}\p{M}'’.-]+)+$/u.test(name))throw Error('Informe seu nome e sobrenome.');
 return name;
}
function reasonText(value){const reason=String(value??'').trim();if(!reason||reason.length>2000)throw Error('Informe um motivo de até 2.000 caracteres.');return reason;}
function stamp(result,actor,changes){const history=[...result.history];history[history.length-1]={...history.at(-1),actor,identity:'self-reported',...(changes?{changes}:{})};return {...result,history};}
export function auditedEdit(record,values,name,at=new Date().toISOString()){
 const actor=fullName(name),allowed=['description','reference','motor','department','supplier','responsible','costCenter','intervention','defect','place','squall','csr','status'];
 const safe=Object.fromEntries(allowed.filter(k=>k in values).map(k=>[k,values[k]]));
 const changes=Object.entries(safe).filter(([k,v])=>v!==record[k]).map(([field,after])=>({field,before:record[field]??'',after}));
 if(!changes.length)return record;
 return stamp(edit(record,safe,at),actor,changes);
}
export function auditedRevise(record,reason,name,at=new Date().toISOString()){return stamp(revise(record,reasonText(reason),at),fullName(name));}
export function auditedDelete(record,reason,name,at=new Date().toISOString()){
 const actor=fullName(name),why=reasonText(reason);if(record.deletedAt)throw Error('O registro já foi excluído.');
 const result=stamp(deleteRecord(record,at),actor);result.history.at(-1).reason=why;return result;
}
export function restoreRecord(record,reason,name,at=new Date().toISOString()){
 const actor=fullName(name),why=reasonText(reason);if(!record.deletedAt)throw Error('O registro não está na lixeira.');
 return {...record,deletedAt:null,updatedAt:at,history:[...record.history,{kind:'Registro restaurado',reason:why,actor,identity:'self-reported',at}]};
}

