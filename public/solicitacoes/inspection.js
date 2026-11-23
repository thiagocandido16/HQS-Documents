import {fullName} from './audit.js';
const HOUR=3600000;
const fieldNames={reason:'Motivo da inspeção',owner:'Responsável pela revisão',exitCondition:'Condição para encerramento',nextReviewDate:'Próxima revisão',conditionMetAt:'Condição atendida em',conditionEvidence:'Evidência da condição atendida',withdrawalRequestedAt:'Pedido de retirada enviado em',requestEvidence:'Referência do pedido de retirada',withdrawnAt:'Retirada confirmada em',withdrawalEvidence:'Confirmação da execução',reviewedAt:'Revisão registrada em',reviewNote:'Justificativa para continuar'};
export const inspectionFieldLabel=field=>field.startsWith('inspection.')?fieldNames[field.slice(11)]:({'control.stage':'Situação operacional','control.operationEnd':'Data de fim da operação'}[field]);
const day=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T12:00:00Z');return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;};
const text=(value,label)=>{if(typeof value!=='string'||!value.trim()||value.length>2000)throw Error('Informe '+label+'.');return value.trim();};
const stamp=(value,label,now)=>{const n=Date.parse(value);if(typeof value!=='string'||!Number.isFinite(n)||new Date(n).toISOString()!==value||n>Date.parse(now))throw Error('Informe '+label+' válido, sem data futura.');return value;};
export const brDate=value=>new Date(Date.parse(value)-3*HOUR).toISOString().slice(0,10);
export function changeInspection(record,mode,values,name,reason='',at=new Date().toISOString()){
 if(record.deletedAt)throw Error('Restaure o registro antes de acompanhar a inspeção.');
 const actor=fullName(name),before=record.control?.inspection||{},inspection={...before};
 if(before.withdrawnAt||record.control?.stage==='Encerrado')throw Error('A operação já está encerrada. Consulte o histórico da retirada.');
 const auditReason=typeof reason==='string'?reason.trim():'';
 if(auditReason.length>2000)throw Error('Use uma justificativa de até 2.000 caracteres.');
 if(mode==='plan'){
  if(before.conditionMetAt)throw Error('Registre uma nova revisão antes de alterar uma condição já informada como atendida.');
  inspection.reason=text(values.reason,'o motivo da inspeção');inspection.owner=fullName(values.owner);inspection.exitCondition=text(values.exitCondition,'a condição para encerramento');
  if(!day(values.nextReviewDate))throw Error('Informe a próxima data de revisão.');inspection.nextReviewDate=values.nextReviewDate;
  if(before.reason&&!auditReason)throw Error('Informe o motivo da alteração do acompanhamento.');
 }else{
  if(!before.reason||!before.owner||!before.exitCondition)throw Error('Preencha o acompanhamento antes de registrar decisões.');
  if(record.control?.stage!=='Em operação')throw Error('Confirme a entrada em operação no controle antes de registrar a revisão ou retirada.');
  if(mode==='keep'){
   inspection.reviewNote=text(values.reviewNote,'por que a inspeção ainda é necessária');
   if(!day(values.nextReviewDate)||values.nextReviewDate<brDate(at))throw Error('Informe uma próxima revisão a partir de hoje.');
   inspection.nextReviewDate=values.nextReviewDate;inspection.reviewedAt=at;
   for(const key of ['conditionMetAt','conditionEvidence','withdrawalRequestedAt','requestEvidence'])inspection[key]='';
  }else if(mode==='ready'){
   if(before.conditionMetAt)throw Error('A condição já foi registrada como atendida.');
   inspection.conditionMetAt=stamp(values.conditionMetAt,'data e horário da condição atendida',at);inspection.conditionEvidence=text(values.conditionEvidence,'a evidência da condição atendida');
   if(brDate(inspection.conditionMetAt)<record.control.operationStart)throw Error('A condição atendida não pode ser anterior ao início da operação.');
   inspection.reviewedAt=at;
  }else if(mode==='request'){
   if(!before.conditionMetAt)throw Error('Registre a condição atendida antes de solicitar a retirada.');
   if(before.withdrawalRequestedAt)throw Error('O envio do pedido de retirada já foi registrado.');
   inspection.withdrawalRequestedAt=stamp(values.withdrawalRequestedAt,'data e horário do pedido enviado',at);inspection.requestEvidence=text(values.requestEvidence,'a referência do pedido de retirada');
   if(inspection.withdrawalRequestedAt<before.conditionMetAt)throw Error('O pedido de retirada não pode ser anterior à condição atendida.');
  }else if(mode==='withdraw'){
   if(!before.conditionMetAt)throw Error('Registre a condição atendida antes de confirmar a retirada.');
   inspection.withdrawnAt=stamp(values.withdrawnAt,'data e horário da retirada executada',at);inspection.withdrawalEvidence=text(values.withdrawalEvidence,'a confirmação de quem executou a retirada');
   if(record.control.operationStart&&brDate(inspection.withdrawnAt)<record.control.operationStart)throw Error('A retirada não pode ser anterior ao início da operação.');
   if(inspection.withdrawnAt<before.conditionMetAt||(before.withdrawalRequestedAt&&inspection.withdrawnAt<before.withdrawalRequestedAt))throw Error('Confira a ordem das datas da condição, do pedido e da retirada.');
  }else throw Error('Ação de acompanhamento inválida.');
 }
 const changes=Object.keys(inspection).filter(key=>(before[key]||'')!==(inspection[key]||'')).map(key=>({field:'inspection.'+key,before:before[key]||'',after:inspection[key]||''}));
 if(!changes.length)return record;
 const control={...record.control,inspection,...(mode==='withdraw'?{stage:'Encerrado',operationEnd:brDate(inspection.withdrawnAt)}:{})};
 if(mode==='withdraw')for(const key of ['stage','operationEnd'])if(control[key]!==record.control?.[key])changes.push({field:'control.'+key,before:record.control?.[key]||'',after:control[key]});
 const kind={plan:'Inspeção · acompanhamento definido',keep:'Inspeção · continuidade justificada',ready:'Inspeção · condição atendida',request:'Inspeção · retirada solicitada',withdraw:'Inspeção · retirada confirmada'}[mode];
 return {...record,control,updatedAt:at,history:[...record.history,{kind,inspectionAction:mode,actor,identity:'self-reported',reason:auditReason||({plan:'Plano de acompanhamento registrado.',keep:inspection.reviewNote,ready:inspection.conditionEvidence,request:inspection.requestEvidence,withdraw:inspection.withdrawalEvidence}[mode]),changes,at}]};
}
export function inspectionState(record,now=Date.now()){
 const inspection=record.control?.inspection;
 if(!inspection?.reason)return {level:'none',label:'Acompanhamento não preenchido'};
 if(inspection.withdrawnAt)return {level:'closed',label:'Retirada confirmada',delayHours:(Date.parse(inspection.withdrawnAt)-Date.parse(inspection.conditionMetAt))/HOUR};
 if(record.control?.stage==='Encerrado')return {level:'legacy',label:'Encerrado · retirada não registrada no acompanhamento'};
 if(inspection.conditionMetAt)return {level:'ready',label:inspection.withdrawalRequestedAt?'Retirada solicitada · aguardando execução':'Condição atendida · preparar retirada',waitingHours:Math.max(0,(now-Date.parse(inspection.conditionMetAt))/HOUR)};
 const overdue=day(inspection.nextReviewDate)&&Date.parse(inspection.nextReviewDate+'T23:59:59.999-03:00')<now;
 return {level:overdue?'overdue':'monitoring',label:overdue?'Revisão da inspeção pendente':'Aguardando próxima revisão'};
}
export function inspectionSummary(records,now=Date.now()){
 const active=records.filter(r=>!r.deletedAt&&!records.some(child=>!child.deletedAt&&child.sourceRequestId&&child.sourceRequestId===r.id));
 const states=active.map(r=>inspectionState(r,now)),completed=states.filter(s=>s.level==='closed'&&Number.isFinite(s.delayHours));
 return {overdue:states.filter(s=>s.level==='overdue').length,ready:states.filter(s=>s.level==='ready').length,completed:completed.length,averageDelayHours:completed.length?completed.reduce((sum,s)=>sum+s.delayHours,0)/completed.length:null};
}

