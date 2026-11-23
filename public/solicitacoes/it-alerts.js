import {pendingItems} from './improvements.js';
import {itPriority} from './it-priority.js';
export function installItAlerts({getRecords,getDocuments,onOpen}){
 const host=document.createElement('section');host.className='it-alert-strip';host.setAttribute('role','status');document.querySelector('#content').before(host);
 function render(){
  const records=getRecords(),documents=getDocuments();
  const priorities=pendingItems(records,documents).map(({record})=>itPriority(record,records,documents)).filter(p=>p&&['overdue','soon','missing'].includes(p.level));
  if(!priorities.length){host.hidden=true;return;}host.hidden=false;
  const overdue=priorities.filter(p=>p.level==='overdue'),soon=priorities.filter(p=>p.level==='soon'),missing=priorities.filter(p=>p.level==='missing');
  host.className='it-alert-strip '+(overdue.length?'overdue':'soon');host.replaceChildren();
  const text=document.createElement('span');text.textContent=[overdue.length?`${overdue.length} IT(s) com prazo vencido`:null,soon.length?`${soon.length} IT(s) vencem em até 24h`:null,missing.length?`${missing.length} IT(s) precisam de conferência do envio`:null].filter(Boolean).join(' · ');
  const button=document.createElement('button');button.type='button';button.textContent='Conferir IT';button.onclick=()=>onOpen((overdue[0]||soon[0]||missing[0]).targetId);host.append(text,button);
 }
 const timer=setInterval(render,60000);window.addEventListener('focus',render);render();return {render,stop(){clearInterval(timer);window.removeEventListener('focus',render);host.remove();}};
}

