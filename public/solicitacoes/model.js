export const motors=['BR10','HR10','HR13','HR16','HR10 e HR13'];
export const departments=['Engenharia','SQF','QFAB','Engenharia Embalagem','Engenharia Processo','Manutenção','Logística','FAB Usinagem','Montagem','Projetos'];
export const interventions=['Triagem','Depotagem','Retrabalho','Limpeza e Depotagem'];
export const places=['RT','LITÍGIO','PICKING','OUTRO'];
export const required=['description','reference','motor','department','supplier','responsible','costCenter','intervention','defect','place','csr','type'];
export function demoNumber(type,year,sequence,revision=0){if(!['STR','IT'].includes(type)||!Number.isInteger(sequence)||sequence<1||!Number.isInteger(revision)||revision<0)throw Error('Numeração inválida');return `DEMO-${type}-${year}-${String(sequence).padStart(3,'0')}${revision?'.'+revision:''}`;}
export function validate(data){return required.filter(key=>!String(data[key]??'').trim());}
export function revise(record,reason,at=new Date().toISOString()){
 if(record.deletedAt)throw Error('O registro foi excluído.');
 if(!reason.trim())throw Error('Informe o motivo da revisão.');
 const revision=record.revision+1;
 return {...record,revision,number:demoNumber(record.type,record.year,record.sequence,revision),updatedAt:at,history:[...record.history,{kind:'Revisão '+revision,reason:reason.trim(),at}]};
}
export function edit(record,values,at=new Date().toISOString()){
 if(record.deletedAt)throw Error('O registro foi excluído.');
 const changes=Object.keys(values).filter(key=>values[key]!==record[key]);
 if(!changes.length)return record;
 return {...record,...values,id:record.id,type:record.type,year:record.year,sequence:record.sequence,revision:record.revision,number:record.number,updatedAt:at,closedAt:values.status==='FECHADO'?(record.closedAt||at):null,history:[...record.history,{kind:'Cadastro atualizado',reason:'Campos: '+changes.join(', '),at}]};
}
export function create(data,records,at=new Date().toISOString()){
 if(validate(data).length)throw Error('Preencha todos os campos obrigatórios.');
 const sequence=records.reduce((max,r)=>Math.max(max,r.sequence||0),0)+1;
 const year=Number(at.slice(0,4));
 return {...data,id:crypto.randomUUID(),sequence,year,revision:0,number:demoNumber(data.type,year,sequence),status:'ABERTO',createdAt:at,updatedAt:at,closedAt:null,history:[{kind:'Solicitação criada',reason:'Número de demonstração emitido.',at}]};
}
export function generateSTR(source,records,at=new Date().toISOString()){
 if(source.deletedAt)throw Error('O registro foi excluído.');
 if(source.type!=='IT')throw Error('Selecione uma IT para gerar a STR vinculada.');
 if(records.some(r=>r.sourceRequestId===source.id))throw Error('Esta IT já possui uma STR vinculada.');
 const data=Object.fromEntries([...required,'squall'].map(key=>[key,source[key]??'']));
 const record=create({...data,type:'STR'},records,at);
 return {...record,sequence:source.sequence,year:source.year,number:source.number.replace(/IT-/,'STR-').replace(/\.\d+$/,''),control:source.control||{},sourceRequestId:source.id,sourceNumber:source.number,history:[{kind:'STR criada a partir de IT',reason:'Origem: '+source.number,at}]};
}
export function deleteRecord(record,at=new Date().toISOString()){
 if(record.deletedAt)return record;
 return {...record,deletedAt:at,updatedAt:at,history:[...record.history,{kind:'Registro excluído',reason:'Removido da consulta. Número mantido reservado.',at}]};
}

