import {fullName} from './audit.js';

export const controlColumns=[
 ['item','Item'],['uet','UET'],['str','STR'],['it','IT'],['operationStatus','Aberta/Fechada?'],['criticality','Criticidade'],
 ['intervention','Triagem/Depotagem/Retrabalho'],['squall','Squall'],['operationStart','Data início'],['operationEnd','Data fim'],
 ['reference','Referência'],['description','Descrição'],['supplier','Fornecedor'],['line','Linha'],['responsible','Responsável criação'],
 ['currentResponsible','Responsável atual'],['costCenter','CC da STR'],['requester','Solicitante'],['defect','Defeito'],['place','RT/Litígio'],
 ['supplierType','POI/POE'],['motor','Motor'],['blocksLastMonth','Bloqueios último mês'],['notes','Observações'],['unitValue','Valor peça'],
 ['updatedUnitValue','Valor peça atualizado'],['unitValue2025','Valor peça atualizado 2025'],['revaluation','Revalorização'],['blocksLast3Months','Bloqueios últimos 3 meses']
];
export const manualControlFields=[['uet','UET'],['criticality','Criticidade'],['line','Linha'],['currentResponsible','Responsável atual'],['requester','Solicitante'],['supplierType','POI/POE'],['operationStart','Data início'],['operationEnd','Data fim'],['notes','Observações']];
export const operationStages=['Pendente de confirmação','Em operação','Encerrado'];
export function toControlRow(record){
 const extra=record.control||{},stage=extra.stage||operationStages[0];
 return {...Object.fromEntries(controlColumns.map(([key])=>[key,''])),...extra,
  item:record.sequence||record.id,str:record.type==='STR'?record.number:'',it:record.type==='IT'?record.number:(record.sourceNumber||''),
  reference:record.reference||'',description:record.description||'',supplier:record.supplier||'',motor:record.motor||'',
  intervention:record.intervention||'',squall:record.squall||'',responsible:record.responsible||'',costCenter:record.costCenter||'',
  defect:record.defect||'',place:record.place||'',operationStatus:stage===operationStages[0]?'Não confirmada':stage===operationStages[1]?'Aberta':'Fechada',stage,
  documentStatus:record.documentId?'Vinculado':'Vínculo ainda não verificado'};
}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T12:00:00Z');return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;}
export function updateControl(record,values,name,at=new Date().toISOString()){
 if(record.deletedAt)throw Error('Restaure o registro antes de alterar o controle.');
 const actor=fullName(name),before=record.control||{},keys=['stage',...manualControlFields.map(([key])=>key)];
 const control={...before};for(const key of keys)if(key in values){if(typeof values[key]!=='string'||values[key].length>2000)throw Error('Informação inválida.');control[key]=values[key].trim();}
 if(!operationStages.includes(control.stage))throw Error('Selecione a situação operacional.');
 if(before.inspection?.reason&&control.stage==='Encerrado'&&!before.inspection.withdrawnAt)throw Error('Use Confirmar retirada no acompanhamento, após confirmar a execução.');
 if(before.inspection?.withdrawnAt&&(control.stage!=='Encerrado'||control.operationEnd!==new Date(Date.parse(before.inspection.withdrawnAt)-3*3600000).toISOString().slice(0,10)))throw Error('A retirada já foi confirmada. Preserve a situação e a data registradas no acompanhamento.');
 if(before.inspection?.conditionMetAt&&control.operationStart>new Date(Date.parse(before.inspection.conditionMetAt)-3*3600000).toISOString().slice(0,10))throw Error('O início não pode ser posterior à condição informada como atendida.');
 for(const key of ['operationStart','operationEnd'])if(control[key]&&!validDate(control[key]))throw Error('Informe uma data válida.');
 if(control.stage!==operationStages[0]&&!control.operationStart)throw Error('Informe a data de início da operação.');
 if(control.stage===operationStages[2]&&!control.operationEnd)throw Error('Informe a data de fim para encerrar a operação.');
 if(control.stage!==operationStages[2]&&control.operationEnd)throw Error('A data de fim exige a situação Encerrado.');
 if(control.stage===operationStages[0]&&control.operationStart)throw Error('Confirme a entrada em operação antes de registrar a data de início.');
 if(control.operationStart&&control.operationEnd&&control.operationEnd<control.operationStart)throw Error('A data de fim deve ser igual ou posterior ao início.');
 const changes=keys.filter(k=>(before[k]||'')!==(control[k]||'')).map(field=>({field:'control.'+field,before:before[field]||'',after:control[field]||''}));
 if(!changes.length)return record;
 return {...record,control,updatedAt:at,history:[...record.history,{kind:'Controle operacional atualizado',actor,identity:'self-reported',reason:'Atualização do controle do setor',changes,at}]};
}
export function registerParameterization(record,sentAt,name,reason='',at=new Date().toISOString()){
 if(record.deletedAt||record.type!=='IT')throw Error('Selecione uma IT ativa para registrar o envio.');
 const actor=fullName(name),stamp=Date.parse(sentAt);
 if(typeof sentAt!=='string'||!Number.isFinite(stamp)||new Date(stamp).toISOString()!==sentAt||stamp>Date.parse(at))throw Error('Informe uma data e um horário de envio válidos, sem data futura.');
 const before=record.control?.parameterizationSentAt||'';
 if(before===sentAt)return record;
 if(typeof reason!=='string'||reason.length>2000||(before&&!reason.trim()))throw Error('Informe o motivo da correção do envio.');
 return {...record,control:{...record.control,parameterizationSentAt:sentAt},updatedAt:at,history:[...record.history,{kind:'Envio de parametrização registrado',actor,identity:'self-reported',reason:reason.trim()||'Envio manual no Outlook informado pelo responsável.',changes:[{field:'control.parameterizationSentAt',before,after:sentAt}],at}]};
}


