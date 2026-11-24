export function editorTarget(requestId=null){
 const url=new URL('/editor','https://hqs.invalid');url.searchParams.set('embedded','1');
 if(requestId)url.searchParams.set('request',requestId);
 return url.pathname+url.search;
}
export function canReplaceEditor(state){return !!state&&!state.dirty&&!state.busy;}

export function createDocumentWorkspace({content,isShared,onRecord,onNew,onSaved,notify}){
 const host=document.createElement('section');host.className='document-workspace';host.hidden=true;
 const toolbar=document.createElement('div');toolbar.className='document-context';
 const caption=document.createElement('span');caption.textContent='Biblioteca de documentos';
 const back=document.createElement('button');back.textContent='← Voltar ao registro';back.hidden=true;
 toolbar.append(back,caption);
 const frame=document.createElement('iframe');frame.title='Criação e edição de documentos STR e IT';frame.className='document-editor-frame';
 host.append(toolbar,frame);content.after(host);
 let target=null,contextId=null,opening=false;
 const state=()=>{try{return frame.contentWindow.HQSDocumentSession?.state;}catch{return null;}};
 back.onclick=()=>{if(contextId)onRecord(contextId);};
 function confirmDiscard(){return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  const heading=document.createElement('h2');heading.textContent='Trocar de documento?';
  const text=document.createElement('p');text.textContent='Há alterações não salvas no documento aberto. Volte para salvar ou descarte para abrir outro.';
  const stay=document.createElement('button');stay.textContent='Continuar no documento';
  const discard=document.createElement('button');discard.textContent='Descartar e abrir outro';discard.className='danger';
  stay.onclick=()=>{dialog.close();resolve(false);};discard.onclick=()=>{dialog.close();resolve(true);};
  dialog.addEventListener('cancel',()=>resolve(false));dialog.addEventListener('close',()=>dialog.remove());
  dialog.append(heading,text,stay,discard);document.body.append(dialog);dialog.showModal();
 });}
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='hqs-document-request'){onNew?.();return;}
  if(event.data?.type!=='hqs-document-saved')return;
  Promise.resolve(onSaved()).catch(()=>notify('Documento salvo. Atualize a consulta para conferir o vínculo.'));
 });
 return {
  hide(){host.hidden=true;content.hidden=false;document.body.classList.remove('documents-view');},
  async open(record){
   if(!isShared()){notify('O editor integrado está disponível no ambiente compartilhado.');return;}
   if(opening)return;opening=true;
   try{
    if(record===undefined&&target){content.hidden=true;host.hidden=false;document.body.classList.add('documents-view');window.scrollTo({top:0,behavior:'instant'});return;}
    const next=editorTarget(record?.id);
    if(target&&next!==target){
     const current=state();
     if(!current||current.busy){notify('Aguarde o carregamento ou salvamento do documento aberto.');return;}
     if(!canReplaceEditor(current)&&!await confirmDiscard()){content.hidden=true;host.hidden=false;document.body.classList.add('documents-view');window.scrollTo({top:0,behavior:'instant'});return;}
     frame.contentWindow.HQSDocumentSession.discard();
    }
    if(next!==target){contextId=record?.id||null;target=next;frame.src=next;}
    caption.textContent=record?record.number+' · '+record.description:'Biblioteca de documentos';back.hidden=!contextId;toolbar.hidden=!contextId;
    content.hidden=true;host.hidden=false;document.body.classList.add('documents-view');window.scrollTo({top:0,behavior:'instant'});
   }finally{opening=false;}
  },
  get isOpen(){return !host.hidden;}
 };
}

