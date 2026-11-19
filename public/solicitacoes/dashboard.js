import {pendingItems,timingSummary} from './improvements.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function showDashboard(host,records,documents,onOpen){
 const pending=pendingItems(records,documents),timing=timingSummary(records),waiting=pending.filter(r=>r.issues.includes('Aguardando documento')).length,operation=pending.filter(r=>r.issues.includes('Aguardando confirmação de operação')).length;
 host.innerHTML=`<div class="hero"><div><span class="eyebrow">ACOMPANHAMENTO</span><h1>Pendências e tempo</h1><p>Documento salvo e confirmação de operação são acompanhados separadamente.</p></div></div><div class="stats">${[['Aguardando documento',waiting],['Aguardando operação',operation],['Com pendências',pending.filter(r=>r.issues.length).length],['Média observada da solicitação',timing.count?(timing.averageSeconds/60).toFixed(1)+' min':'Sem amostras']].map(([label,value])=>`<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div><section class="card"><div class="card-body"><p class="subtle">${timing.count} solicitações com medição. O tempo observado considera intervalos entre interações de até 60 segundos na aba visível; não mede a criação do documento nem comprova economia financeira. Os números DEMO são testes e não devem ser usados como resultado oficial.</p><div class="table-wrap"><table><thead><tr><th>Solicitação</th><th>Pendências</th><th></th></tr></thead><tbody>${pending.filter(r=>r.issues.length).map(({record,issues})=>`<tr><td>${esc(record.number)}<span class="table-description">${esc(record.description)}</span></td><td style="white-space:normal">${issues.map(esc).join('<br>')}</td><td><button data-open-request="${esc(record.id)}">Abrir registro</button></td></tr>`).join('')||'<tr><td colspan="3">Nenhuma pendência encontrada.</td></tr>'}</tbody></table></div></div></section>`;
 host.querySelectorAll('[data-open-request]').forEach(b=>b.onclick=()=>onOpen(b.dataset.openRequest));
}
export function mountReferencePicker(form,catalog,notify){
 const input=form.elements.reference;if(!input)return;
 const section=document.createElement('div');section.className='wide';input.closest('label').after(section);
 input.addEventListener('input',()=>{section.replaceChildren();const matches=catalog.filter(r=>String(r.reference).trim().toUpperCase()===input.value.trim().toUpperCase());if(!matches.length)return;
  const title=document.createElement('p');title.textContent='Referência encontrada. Escolha o cadastro e confira os dados:';section.append(title);
  for(const item of matches){const button=document.createElement('button');button.type='button';button.textContent=[item.description,item.motor,item.supplier].filter(Boolean).join(' · ');button.onclick=()=>{
   const fields=['description','motor','supplier'].filter(key=>item[key]);
   if(fields.some(key=>form.elements[key].value&&form.elements[key].value!==item[key])&&!confirm('Substituir os dados de peça, motor e fornecedor pelos deste cadastro?'))return;
   for(const key of fields){const field=form.elements[key];if(field.tagName==='SELECT'&&![...field.options].some(o=>o.value===item[key]))field.add(new Option(item[key],item[key]));field.value=item[key];}
   notify('Dados da referência preenchidos. Confira antes de salvar.');
  };section.append(button);}
 });
}

