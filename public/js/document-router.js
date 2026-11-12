window.HQSDocumentRouter={
 install({parent,str,it}){
    let active='STR';const controllers={STR:str,IT:it};
    function choose(type){if(!controllers[type])throw Error('Tipo de documento inválido.');active=type;str.host.hidden=type!=='STR';it.host.hidden=type!=='IT';document.querySelectorAll('[data-local-document-type]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.localDocumentType===type)));const status=document.querySelector('.document-status');if(status)Array.from(status.childNodes).filter(node=>node.nodeType===3).forEach(node=>{node.textContent=` Editor ${type}`;});}
    window.HQSEditor={snapshot:()=>({...controllers[active].snapshot(),documentType:active}),restore:state=>{const type=state.documentType==='IT'?'IT':'STR';controllers[type].restore(state);choose(type);},reset:(type='STR')=>{controllers[type].reset();choose(type);},meta:()=>({...controllers[active].meta(),documentType:active}),getType:()=>active};
    if(!document.getElementById('new-document')){
        const bar=document.createElement('nav');bar.className='local-document-types';bar.setAttribute('aria-label','Tipo de documento');
        bar.innerHTML='<strong>Criar / preencher documento</strong><button type="button" data-local-document-type="STR">STR — Solicitação de Trabalho</button><button type="button" data-local-document-type="IT">IT — Instrução Inicial de Trabalho</button>';
        bar.querySelectorAll('button').forEach(button=>{button.onclick=()=>{choose(button.dataset.localDocumentType);window.scrollTo({top:0,behavior:'smooth'});};});parent.before(bar);
    }
    choose('STR');document.dispatchEvent(new Event('hqs-ready'));
 }
};
