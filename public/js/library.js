/* Biblioteca compartilhada e versões dos documentos. */
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    let current = null, dirty = false, loading = false, busy = false, documents = [], trashMode = false, trashEnabled = false, pendingAction = null;
    const embedded=new URL(location).searchParams.get('embedded')==='1'&&window.parent!==window;
    let initializing=!!new URL(location).searchParams.get('request');
    window.HQSDocumentSession={get state(){return {dirty,busy:busy||loading||initializing,documentId:current?.id||null};},discard(){dirty=false;}};
    const signalSaved=()=>{if(embedded)window.parent.postMessage({type:'hqs-document-saved'},location.origin);};
    if(embedded){
        document.body.classList.add('embedded-editor');
        const style=document.createElement('style');style.textContent='.embedded-editor .library-header,.embedded-editor .library-create-actions a{display:none!important}.embedded-editor .library-intro{padding-top:24px}.embedded-editor .library-main{padding:24px}.embedded-editor .cloud-bar{flex-wrap:wrap;gap:10px}';document.head.append(style);
    }
    const editor = () => window.HQSEditor;
    const formatDate = value => new Intl.DateTimeFormat('pt-BR', {dateStyle:'short', timeStyle:'short'}).format(new Date(value));
    const message = (text, error = false) => { $('library-message').textContent=text; $('library-message').className=error?'error-message':''; };
    function markDirty() {
        if (loading || document.body.classList.contains('library-mode')) return;
        dirty=true; $('save-state').textContent='Alterações não salvas';title();
    }
    async function request(url, options) {
        const response=await fetch(url,{cache:'no-store',...options});
        let data;try {data=await response.json();} catch {throw Error('O servidor não respondeu como esperado. Tente novamente.');}
        if(!response.ok) throw Error(data.error || 'Não foi possível concluir esta ação.');
        return data;
    }
    function leaveAllowed() {return !dirty || confirm('Há alterações não salvas. Deseja sair sem salvar?');}
    function setLocation(id) {const url=new URL(location);if(id)url.searchParams.set('document',id);else url.searchParams.delete('document');history.replaceState(null,'',url);}
    function showEditor() {document.body.classList.remove('library-mode');window.scrollTo(0,0);}
    function title() {
        $('current-document').textContent=(editor().meta().str || `Novo documento ${editor().getType()}`) + (current ? ` · versão ${current.openedVersion || current.revision}`:'');
        $('open-history').disabled=!current;
    }
    function renderList() {
        const search=$('document-search').value.toLocaleLowerCase('pt-BR');
        const filter=$('document-type-filter').value;
        const filtered=documents.filter(doc=>(!filter||(doc.document_type||'STR')===filter)&&[doc.str,doc.product,doc.defect].join(' ').toLocaleLowerCase('pt-BR').includes(search));
        $('document-count').textContent=`${filtered.length} ${filtered.length===1?'documento':'documentos'}`;
        const list=$('document-list');list.replaceChildren();
        if(!filtered.length) {
            const empty=document.createElement('div');empty.className='library-empty';
            const h=document.createElement('h2');h.textContent=trashMode?'Lixeira vazia':search?'Nenhum resultado':'Seu primeiro documento começa aqui.';
            const p=document.createElement('p');p.textContent=trashMode?'Documentos excluídos aparecerão aqui para consulta do histórico e restauração.':search||filter?'Tente outro número, peça, defeito ou tipo de documento.':embedded?'Use “Solicitar número e criar” para iniciar com os dados da operação.':'Use “Criar documento” e escolha STR ou IT para começar.';
            empty.append(h,p);list.append(empty);return;
        }
        filtered.forEach(doc=>{
            const card=document.createElement('article');card.className='document-card';
            const top=document.createElement('div');top.className='document-card-top';
            const badge=document.createElement('span');badge.className='document-version';badge.textContent=`${doc.document_type||'STR'} · VERSÃO ${doc.revision}`;
            const h=document.createElement('h2');h.textContent=doc.str || `${doc.document_type||'STR'} sem número`;top.append(h,badge);
            const product=document.createElement('h3');product.textContent=doc.product || 'Peça não informada';
            const defect=document.createElement('p');defect.className='document-defect';defect.textContent=doc.defect || 'Defeito não informado';
            const foot=document.createElement('div');foot.className='document-card-foot';
            const meta=document.createElement('small');meta.textContent=`Atualizado em ${formatDate(doc.updated_at)} · ${doc.author}`;
            const button=document.createElement('button');button.textContent=trashMode?'Restaurar documento':'Abrir documento →';button.onclick=()=>trashMode?showLifecycle(doc,'restore'):openDocument(doc.id);
            if(trashEnabled){const audit=document.createElement('button');audit.textContent=trashMode?'Ver histórico':'Excluir';audit.className=trashMode?'':'document-delete';audit.onclick=()=>trashMode?showHistory(doc.id):showLifecycle(doc,'delete');foot.append(audit);}
            foot.append(meta,button);card.append(top,product,defect,foot);list.append(card);
        });
    }
    async function refreshLibrary() {
        message('Carregando documentos…');
        try {const data=await request('/api/documents'+(trashMode?'?trash=1':''));documents=data.documents;trashEnabled=!!data.trashEnabled;$('toggle-trash').disabled=!trashEnabled;$('toggle-trash').title=trashEnabled?'Consultar documentos excluídos e restaurar':'A lixeira precisa ser ativada no banco';$('toggle-trash').textContent=trashMode?'← Documentos ativos':'Lixeira';renderList();message('');}
        catch(error){message(error.message,true);$('document-count').textContent='Lista indisponível';}
    }
    async function openDocument(id, version) {
        if(busy || !leaveAllowed())return;
        busy=true;loading=true;
        try {
            const data=await request(`/api/documents?id=${encodeURIComponent(id)}${version?'&version='+version:''}`);
            editor().restore(data.state);current={...data.document,openedVersion:data.version};dirty=false;
            $('save-state').textContent=data.version===data.document.revision?'Documento salvo':`Consultando versão ${data.version}; salvar criará uma nova versão`;
            title();setLocation(id);showEditor();if($('history-dialog').open)$('history-dialog').close();
        } catch(error){alert(error.message);} finally {loading=false;busy=false;}
    }
    function newDocument(type) {
        if(busy || !leaveAllowed())return;
        loading=true;editor().reset(type);current=null;dirty=false;title();setLocation(null);showEditor();$('document-type-dialog').close();
        $('save-state').textContent='Ainda não salvo';loading=false;
    }
    if(embedded)$('new-document').textContent='+ Solicitar número e criar';
    $('new-document').onclick=()=>{if(busy)return;if(embedded){window.parent.postMessage({type:'hqs-document-request'},location.origin);return;}$('document-type-dialog').showModal();};
    $('close-document-type').onclick=()=>$('document-type-dialog').close();
    document.querySelectorAll('[data-new-type]').forEach(button=>{button.onclick=()=>newDocument(button.dataset.newType);});
    $('document-search').oninput=renderList;
    $('document-type-filter').onchange=renderList;
    $('refresh-library').onclick=refreshLibrary;
    $('toggle-trash').onclick=()=>{if(busy)return;trashMode=!trashMode;refreshLibrary();};
    $('back-library').onclick=()=>{
        if(busy || !leaveAllowed())return;
        dirty=false;document.body.classList.add('library-mode');setLocation(null);refreshLibrary();window.scrollTo(0,0);
    };
    $('save-document').onclick=()=>{
        if(busy)return;
        if(window.HQSImages.isLoading?.()){alert('Aguarde o carregamento das imagens antes de salvar.');return;}
        $('save-error').textContent='';$('save-note').value='';$('save-dialog').showModal();
    };
    $('confirm-save').onclick=async()=>{
        if(busy)return;
        busy=true;const button=$('confirm-save');button.disabled=true;button.textContent='Salvando…';
        $('save-error').textContent='';
        try {
            if(trashEnabled&&!validName($('save-author').value))throw Error('Informe seu nome e sobrenome.');
            const savedState=editor().snapshot();
            const data=await request('/api/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                id:current?.id,expectedRevision:current?.revision,state:savedState,meta:editor().meta(),author:$('save-author').value,note:$('save-note').value
            })});
            current={id:data.id,revision:data.revision,openedVersion:data.revision};dirty=JSON.stringify(editor().snapshot())!==JSON.stringify(savedState);title();setLocation(data.id);
            $('save-state').textContent=dirty?'Versão salva; há alterações posteriores não salvas':`Salvo às ${new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
            $('save-dialog').close();signalSaved();
        } catch(error){$('save-error').textContent=error.message;}
        finally {busy=false;button.disabled=false;button.textContent='Salvar versão';}
    };
    $('save-dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    $('save-form').addEventListener('submit',e=>{if(busy)e.preventDefault();});
    async function showHistory(id){
        if(busy)return;
        const list=$('version-list');list.textContent='Carregando versões…';$('history-dialog').showModal();
        try {
            const data=await request(`/api/documents?id=${id}&history=1`);list.replaceChildren();
            data.actions?.forEach(action=>{const row=document.createElement('article');row.className='version-row';const text=document.createElement('div');const h=document.createElement('strong');h.textContent=action.action==='delete'?'Documento excluído':'Documento restaurado';const p=document.createElement('p');p.textContent=action.reason;const meta=document.createElement('small');meta.textContent=formatDate(action.created_at)+' · Nome informado: '+action.author;text.append(h,p,meta);row.append(text);list.append(row);});
            data.versions.forEach(v=>{
                const row=document.createElement('article');row.className='version-row';
                const text=document.createElement('div');const h=document.createElement('strong');h.textContent=`Versão ${v.version}`;
                const p=document.createElement('p');p.textContent=v.note;const meta=document.createElement('small');meta.textContent=`${formatDate(v.created_at)} · ${v.author}`;text.append(h,p,meta);
                const b=document.createElement('button');b.textContent='Abrir versão';b.onclick=()=>openDocument(id,v.version);row.append(text);if(!data.document.deleted_at)row.append(b);list.append(row);
            });
        } catch(error){list.textContent=error.message;}
    }
    $('open-history').onclick=()=>{if(current)showHistory(current.id);};
    $('close-history').onclick=()=>$('history-dialog').close();
    document.querySelector('.workspace').addEventListener('input',markDirty);
    document.querySelector('.workspace').addEventListener('click',e=>{
        if(e.target.closest('.add-page-button,.delete-operation-page,.undo-page,.remove-photo,.it-add-page,.it-delete-page,.it-undo-page'))markDirty();
    });
    document.querySelector('.workspace').addEventListener('hqs-photochange',markDirty);
    window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
    const validName=value=>/^\p{L}[\p{L}\p{M}'’.-]*(?: +[\p{L}\p{M}'’.-]+)+$/u.test(value.trim())&&value.trim().length<=200;
    function showLifecycle(doc,action){if(busy)return;pendingAction={doc,action};$('lifecycle-form').reset();$('lifecycle-error').textContent='';$('lifecycle-title').textContent=action==='delete'?'Excluir documento':'Restaurar documento';$('lifecycle-description').textContent=(doc.str||'Documento sem número')+(action==='delete'?' será movido para a lixeira. As fotos e todas as versões serão preservadas.':' voltará à biblioteca com as fotos e versões originais.');$('lifecycle-dialog').showModal();}
    $('confirm-lifecycle').onclick=async()=>{if(busy||!pendingAction)return;if(!$('lifecycle-form').reportValidity())return;const author=$('lifecycle-author').value.trim(),reason=$('lifecycle-reason').value.trim();if(!validName(author)||!reason){$('lifecycle-error').textContent='Informe nome e sobrenome e o motivo.';return;}busy=true;$('confirm-lifecycle').disabled=true;try{const {doc,action}=pendingAction;await request('/api/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:doc.id,expectedRevision:doc.revision,expectedUpdatedAt:doc.updated_at,author,reason})});$('lifecycle-dialog').close();pendingAction=null;await refreshLibrary();signalSaved();}catch(error){$('lifecycle-error').textContent=error.message;}finally{busy=false;$('confirm-lifecycle').disabled=false;}};
    $('lifecycle-dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    $('lifecycle-form').addEventListener('submit',e=>{if(busy)e.preventDefault();});
    title();refreshLibrary();
    const initialId=new URL(location).searchParams.get('document');if(initialId)openDocument(initialId);
    else {
        const requestId=new URL(location).searchParams.get('request');
        if(requestId)(async()=>{try{
            const {record}=await request('/api/requests?id='+encodeURIComponent(requestId));
            const list=await request('/api/documents');const matches=list.documents.filter(d=>d.document_type===record.type&&d.str===record.number);
            if(matches.length>1)throw Error('Há mais de um documento com esse número. Confira a biblioteca antes de continuar.');
            if(matches.length){await openDocument(matches[0].id);return;}
            newDocument(record.type);window.HQSRequestPrefill.apply(record);dirty=true;title();
            $('save-state').textContent='Dados da solicitação preenchidos. Confira e salve o documento.';
        }catch(error){message(error.message,true);}finally{initializing=false;}})();
    }
});

