export const normalizeReference=value=>String(value??'').trim().toLocaleUpperCase('pt-BR');
export function referenceMatches(catalog,value){return catalog.filter(item=>normalizeReference(item.reference)===normalizeReference(value));}
export function pendingItems(records,documents){
 return records.filter(r=>!r.deletedAt&&!records.some(child=>!child.deletedAt&&child.sourceRequestId===r.id)).map(record=>{
  const matches=documents.filter(d=>!d.deleted_at&&d.document_type===record.type&&normalizeReference(d.str)===normalizeReference(record.number));
  const missing=[['description','Peça'],['reference','Referência'],['supplier','Fornecedor'],['motor','Motor'],['defect','Defeito']].filter(([key])=>!String(record[key]||'').trim()).map(([,label])=>label);
  const issues=[];if(!matches.length)issues.push('Aguardando documento');if(matches.length>1)issues.push('Conferir documentos duplicados');
  if(!record.control?.stage||record.control.stage==='Pendente de confirmação')issues.push('Aguardando confirmação de operação');
  if(!String(record.control?.currentResponsible||'').trim())issues.push('Responsável atual pendente');
  if(missing.length)issues.push('Informações incompletas: '+missing.join(', '));
  return {record,issues,documents:matches};
 });
}
export function timingSummary(records){
 const samples=records.filter(r=>!r.deletedAt&&Number.isFinite(r.timing?.activeSeconds)&&r.timing.activeSeconds>0);
 return {count:samples.length,averageSeconds:samples.length?samples.reduce((sum,r)=>sum+r.timing.activeSeconds,0)/samples.length:0};
}
export function formTimer(clock=()=>performance.now()){
 const start=clock();let active=0,last=start,touched=false;
 return {touch(visible=true){const now=clock(),gap=now-last;if(touched&&visible&&gap>=0&&gap<=60000)active+=gap;last=now;touched=true;},result(){return {activeSeconds:Math.round(active/1000),elapsedSeconds:Math.round((clock()-start)/1000),method:'interaction-gaps-under-60s-v1',phase:'number-request'};}};
}

