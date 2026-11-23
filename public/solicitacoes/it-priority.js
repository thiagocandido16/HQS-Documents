const HOUR=3600000;
export function sentInputToISO(date,time){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return null;
 const stamp=Date.parse(`${date}T${time}:00-03:00`);
 if(!Number.isFinite(stamp)||new Date(stamp-3*HOUR).toISOString().slice(0,10)!==date)return null;
 return new Date(stamp).toISOString();
}
export function itPriority(record,records=[],documents=[],now=Date.now()){
 const source=record.type==='IT'?record:records.find(r=>r.id===record.sourceRequestId&&r.type==='IT');
 if(!source||record.deletedAt)return null;
 const converted=records.find(r=>!r.deletedAt&&r.type==='STR'&&r.sourceRequestId===source.id);
 const stage=converted?.control?.stage||source.control?.stage;
 if(stage==='Encerrado')return null;
 const target=converted||source;
 if(converted&&documents.some(d=>!d.deleted_at&&d.document_type==='STR'&&d.str===converted.number))return null;
 const sentAt=source.control?.parameterizationSentAt;
 if(!sentAt)return {level:'waiting',label:'IT · envio de parametrização não registrado',targetId:target.id};
 const start=Date.parse(sentAt);
 if(!Number.isFinite(start)||start>now)return {level:'missing',label:'IT · conferir data e horário do envio',targetId:target.id};
 const deadline=start+72*HOUR,remaining=deadline-now;
 const level=remaining<=0?'overdue':remaining<=24*HOUR?'soon':'normal';
 const label=level==='overdue'?'IT · prazo de 72h vencido':level==='soon'?'IT · vence em até 24h':'IT · dentro do prazo';
 return {level,label,deadline,remaining,targetId:target.id,converted:!!converted};
}
export const deadlineLabel=value=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(value);
export function priorityMarkup(priority,escape){
 if(!priority)return '';
 return `<span class="it-priority ${priority.level}">${escape(priority.label)}</span>${priority.deadline?`<small class="it-deadline">Vencimento: ${escape(deadlineLabel(priority.deadline))} · Brasília</small>`:''}`;
}
export function priorityNotice(record,records,documents,escape){
 const priority=itPriority(record,records,documents);if(!priority)return '';
 const attention=['overdue','soon','missing'].includes(priority.level);
 const source=record.type==='IT'?record:records.find(r=>r.id===record.sourceRequestId),converted=records.find(r=>r.sourceRequestId===source?.id);
 const action=converted&&!converted.deletedAt?`<button data-action="detail" data-id="${escape(converted.id)}">Conferir STR vinculada</button>`:!converted?`<button data-action="generate-str" data-id="${escape(source.id)}">Converter para STR</button>`:'';
 return `<section class="it-notice ${priority.level}" role="status">${priorityMarkup(priority,escape)}<p>Prazo: 72 horas corridas a partir do envio informado do pedido de parametrização. ${attention?'Conclua a STR vinculada para continuar ou solicite a desparametrização e registre a retirada somente após a confirmação da execução.':'Copiar a mensagem não inicia o prazo. Registre o envio depois de enviar o e-mail no Outlook.'}</p><div class="actions left">${action}<button data-action="it-control" data-id="${escape(priority.targetId)}">Envio / desparametrização</button></div></section>`;
}

