import {toControlRow} from './control.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function communication(record,action){
 if(!['Parametrização','Desparametrização'].includes(action))throw Error('Selecione uma ação válida.');
 if(record.deletedAt)throw Error('Restaure o registro antes de preparar a mensagem.');
 const row=toControlRow(record);
 const fields=[['STR',row.str],['IT',row.it],['Situação operacional',row.operationStatus],['Operação',row.intervention],['Data início',row.operationStart],['Data fim',row.operationEnd],['Referência',row.reference],['Descrição',row.description],['Fornecedor',row.supplier],['Linha',row.line],['Responsável',row.currentResponsible||row.responsible],['Motor',row.motor],['Defeito',row.defect]];
 const intro=`Favor realizar a ${action.toLocaleLowerCase('pt-BR')} de defeito da referência ${row.reference||'não informada'}, conforme abaixo:`;
 const subject=`${action} · ${record.number} · ${row.reference||'Referência não informada'}`;
 const text=`Bom dia!\n\n${intro}\n\n${fields.map(([label,value])=>`${label}: ${value||'Não informado'}`).join('\n')}\n\nFavor confirmar a execução e a data efetiva.\nObrigado.`;
 const html=`<div style="font-family:Arial,sans-serif;color:#29353d"><p>Bom dia!</p><p>${escape(intro)}</p><table style="border-collapse:collapse"><tbody>${fields.map(([label,value])=>`<tr><th style="border:1px solid #aaa;padding:8px;text-align:left;background:#f1f1f1">${escape(label)}</th><td style="border:1px solid #aaa;padding:8px;white-space:pre-wrap">${escape(value||'Não informado')}</td></tr>`).join('')}</tbody></table><p>Favor confirmar a execução e a data efetiva.</p><p>Obrigado.</p></div>`;
 return {subject,text,html};
}
export function mountCommunication(host,record,notify){
 host.innerHTML='<div class="card-head"><h2>Comunicar à logística</h2></div><div class="card-body"><p class="subtle">Prepare a mensagem, confira os dados e cole no Outlook. Copiar não envia e não confirma a execução.</p><div class="actions left" style="margin:18px 0"><button data-message="Parametrização">Preparar parametrização</button><button data-message="Desparametrização">Preparar desparametrização</button></div><div data-message-preview></div></div>';
 host.querySelectorAll('[data-message]').forEach(button=>button.onclick=()=>{
  const message=communication(record,button.dataset.message),preview=host.querySelector('[data-message-preview]');
  preview.innerHTML=`<label>Assunto<input readonly value="${escape(message.subject)}"></label><div class="table-wrap" style="margin:18px 0">${message.html}</div><div class="actions left"><button data-copy-subject>Copiar assunto</button><button class="primary" data-copy-body>Copiar mensagem e tabela</button></div><label style="margin-top:18px">Texto alternativo para selecionar e copiar<textarea readonly rows="8">${escape(message.text)}</textarea></label>`;
  preview.querySelector('[data-copy-subject]').onclick=async()=>{try{await navigator.clipboard.writeText(message.subject);notify('Assunto copiado.');}catch{notify('Selecione o assunto acima e copie manualmente.');}};
  preview.querySelector('[data-copy-body]').onclick=async()=>{try{
   if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined')await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([message.html],{type:'text/html'}),'text/plain':new Blob([message.text],{type:'text/plain'})})]);
   else await navigator.clipboard.writeText(message.text);
   notify('Mensagem copiada. Cole no Outlook, confira os destinatários e envie.');
  }catch{notify('Não foi possível copiar. Selecione o texto alternativo e copie manualmente.');}};
 });
}

