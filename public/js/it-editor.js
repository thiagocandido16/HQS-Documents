/* Instrução Inicial de Trabalho, pessoas treinadas e EPIs. */
window.HQSIT = {
    create(parent) {
        const host=document.createElement('div');host.className='it-document-host';host.hidden=true;parent.appendChild(host);
        const fields=new Map(),pages=[],training=[];let serial=0,removed=null;
        host.innerHTML='<div class="workspace-heading"><div><span class="eyebrow">EDITOR DE DOCUMENTOS</span><h1>Instrução Inicial de Trabalho</h1><p>Modelo IT · Preenchimento e impressão A4</p></div><span class="page-indicator">A4 · RETRATO</span></div><div class="it-editor-actions"><button type="button" class="it-add-page">+ ADICIONAR PÁGINA DE INSTRUÇÕES</button><span class="it-removed" hidden>Página excluída. <button type="button" class="it-undo-page">Desfazer exclusão</button></span></div>';
        function mirror(field){const output=document.createElement('div');output.className='it-print-value';output.setAttribute('aria-hidden','true');field.after(output);field.addEventListener('input',()=>{output.textContent=field.value;});return output;}
        function field(parent,key,label,type='text'){
            const wrap=document.createElement('div');wrap.className='it-field';
            const name=document.createElement('label');name.textContent=label;name.htmlFor='it-'+key;
            const input=document.createElement(type==='textarea'?'textarea':'input');
            if(type!=='textarea')input.type=type;else input.rows=2;
            input.id='it-'+key;input.setAttribute('aria-label',label);fields.set(key,input);
            wrap.append(name,input);parent.append(wrap);mirror(input);input.addEventListener('input',sync);return input;
        }
        function check(parent,key,label,{radio=false,value='',checked=false}={}){
            const wrap=document.createElement('label'),input=document.createElement('input');
            input.type=radio?'radio':'checkbox';if(radio)input.name='it-csr';if(value)input.value=value;input.checked=checked;
            input.setAttribute('aria-label',label);fields.set(key,input);wrap.append(input,document.createTextNode(label));parent.append(wrap);return input;
        }
        function header(page,first=false){
            const el=document.createElement('header');el.className='it-header';
            el.innerHTML='<img src="./assets/logo/horse-logo.png" alt="HORSE" class="it-horse-logo"><div><span>HORSE QUALITY SYSTEM</span><h2>Instrução Inicial de Trabalho</h2></div><div class="it-number-box"></div>';
            page.append(el);
            if(first){const number=field(el.querySelector('.it-number-box'),'number','NÚMERO IT');number.placeholder='Digite o número IT';}
            else el.querySelector('.it-number-box').innerHTML='<span>NÚMERO IT</span><strong data-it-source="number"></strong>';
        }
        function footer(page){const el=document.createElement('footer');el.className='operation-page-footer';el.innerHTML='<span>RPIF-HGQUA-2024-0021</span><span>Internal Use · Confidential C</span><span class="it-page-number"></span>';page.append(el);}
        function photoSlot(id){
            const wrap=document.createElement('div');wrap.className='operation-photos it-single-photo';
            const slot=document.createElement('div');slot.className='photo-slot';slot.tabIndex=0;
            slot.innerHTML=`<div class="photo-preview"><div class="photo-placeholder">Clique e cole com <strong>Ctrl+V</strong><br>ou anexe uma imagem abaixo.</div><img class="operation-photo" alt="Foto da instrução"></div><div class="photo-caption"></div><div class="photo-controls"><input type="file" class="photo-upload" accept="image/*" aria-label="Anexar imagem da instrução"><label for="it-photo-size-${id}">Tamanho da imagem</label><input type="range" id="it-photo-size-${id}" class="photo-size" min="30" max="100" value="100"><button type="button" class="remove-photo">Remover imagem</button><span class="photo-status" role="status"></span></div>`;
            const upload=slot.querySelector('.photo-upload');upload.addEventListener('change',()=>window.HQSImages.createPreview(upload.files[0],data=>window.HQSImages.applyImage(slot,data)));
            slot.querySelector('.photo-preview').onclick=()=>slot.focus();
            slot.querySelector('.photo-size').addEventListener('input',e=>window.HQSImages.resizeImage(slot,e.target.value));
            slot.querySelector('.remove-photo').onclick=()=>window.HQSImages.removeImage(slot);
            window.HQSImages.bindSlot(slot);wrap.append(slot);return wrap;
        }
        function createPage(){
            const first=pages.length===0,id=++serial,page=document.createElement('article');page.className='it-page';
            if(!first){const actions=document.createElement('div');actions.className='it-page-actions';actions.innerHTML='<button type="button" class="it-delete-page">Excluir esta página</button>';actions.querySelector('button').onclick=()=>{const index=pages.indexOf(page);if(index<1)return;removed={page,index};pages.splice(index,1);page.remove();host.querySelector('.it-removed').hidden=false;update();host.querySelector('.it-editor-actions').scrollIntoView({behavior:'smooth',block:'start'});};page.append(actions);}
            header(page,first);
            if(first){
                const identification=document.createElement('section');identification.className='it-identification';page.append(identification);
                field(identification,'reference','REFERÊNCIA(S)','textarea');field(identification,'part','DESCRIÇÃO DA PEÇA','textarea');field(identification,'motor','MOTOR');
                const csr=document.createElement('section');csr.className='it-inline-options';csr.innerHTML='<strong>Impacto CSR:</strong>';page.append(csr);check(csr,'csrYes','SIM',{radio:true,value:'sim'});check(csr,'csrNo','NÃO',{radio:true,value:'nao',checked:true});
                const defects=document.createElement('section');defects.className='it-defects';page.append(defects);
                field(defects,'technicalDefect','DESCRIÇÃO DO DEFEITO TÉCNICO','textarea');field(defects,'strDefect','DESCRIÇÃO DO DEFEITO QUE ESTARÁ NA STR','textarea');
            }else{
                const identification=document.createElement('section');identification.className='it-continuation-summary';
                identification.innerHTML='<div><strong>Peça: </strong><span data-it-source="part"></span></div><div><strong>Referência: </strong><span data-it-source="reference"></span></div><div><strong>Motor: </strong><span data-it-source="motor"></span></div><div><strong>Defeito: </strong><span data-it-source="technicalDefect"></span></div>';page.append(identification);
            }
            const heading=document.createElement('h3');heading.className='it-section-title';heading.textContent='DESCRIÇÃO DA TRIAGEM';page.append(heading);
            const grid=document.createElement('div');grid.className='it-instruction-grid';
            for(let i=0;i<4;i++){
                const tile=document.createElement('section');tile.className='it-instruction';const label=document.createElement('label');label.htmlFor=`it-step-${id}-${i}`;
                const description=document.createElement('textarea');description.id=label.htmlFor;description.rows=2;description.placeholder='Descreva esta etapa...';
                tile.append(label,description);mirror(description);tile.append(photoSlot(`${id}-${i}`));grid.append(tile);
            }page.append(grid);
            if(first){
                const marks=document.createElement('section');marks.className='it-inline-options it-marks';marks.innerHTML='<strong>Identificação das peças:</strong>';page.append(marks);
                check(marks,'markPilot','Caneta Pilot');check(marks,'markIndustrial','Marcador industrial');check(marks,'markLabel','Etiqueta');check(marks,'markOther','Outro');field(marks,'markOtherText','Especificar outro');
                const activities=document.createElement('section');activities.className='it-activities';page.append(activities);
                const containment=document.createElement('div');activities.append(containment);check(containment,'containment','1 — Contenção');field(containment,'containmentDetails','Detalhes da contenção');
                const sampling=document.createElement('div');activities.append(sampling);check(sampling,'sampling','2 — Amostragem');field(sampling,'samplingDetails','Detalhes da amostragem');
                check(activities,'rework','3 — Retrabalho');check(activities,'parameterization','4 — Parametrização');
                const requester=document.createElement('section');requester.className='it-requester';page.append(requester);
                field(requester,'start','DATA DE INÍCIO','date');field(requester,'costCenter','CENTRO DE CUSTO');field(requester,'requester','SOLICITANTE');field(requester,'area','ÁREA');
                const signature=document.createElement('div');signature.className='it-signature';signature.textContent='Assinatura do solicitante';page.append(signature);
                const notice=document.createElement('div');notice.className='it-notice';notice.textContent='1 — A IIT tem validade de 72h a partir da data de início da triagem. Até o fim deste prazo, a STR deve ser entregue ao prestador do serviço. Sem a STR após 72h do início do serviço, a atividade será suspensa até a entrega da mesma. 2 — A IIT deve ser entregue totalmente preenchida e assinada. O solicitante se responsabiliza por entregar a IIT impressa ou preenchida manualmente nas RTs, onde o formulário está disponível.';page.append(notice);
            }
            footer(page);pages.push(page);host.insertBefore(page,trainingPage || null);update();sync();return page;
        }
        const trainingPage=document.createElement('article');trainingPage.className='it-training-page';
        header(trainingPage);const title=document.createElement('h3');title.className='it-section-title';title.textContent='PESSOAS TREINADAS PARA REALIZAR A ATIVIDADE';trainingPage.append(title);
        const table=document.createElement('table');table.className='it-training-table';table.innerHTML='<colgroup><col style="width:14%"><col style="width:66%"><col style="width:20%"></colgroup><thead><tr><th>Identificação</th><th>Nome</th><th>Turno</th></tr></thead><tbody></tbody>';
        for(let i=0;i<20;i++){
            const row=table.tBodies[0].insertRow();row.insertCell().textContent=i<2?`Líder ${i+1}ºT`:String(i-1);
            const name=document.createElement('input');name.type='text';name.setAttribute('aria-label',`Nome da pessoa treinada ${i+1}`);row.insertCell().append(name);mirror(name);
            const shift=document.createElement('input');shift.type='text';shift.setAttribute('aria-label',`Turno da pessoa treinada ${i+1}`);shift.value=i<2?`${i+1}º`:'';row.insertCell().append(shift);mirror(shift);training.push({name,shift});
        }trainingPage.append(table);footer(trainingPage);host.append(trainingPage);
        const ppe=window.HQSPPE.create({workspace:host,documentType:'IT'});
        function update(){const total=pages.length+2;let step=0;pages.forEach((page,i)=>{page.querySelector('.it-page-number').textContent=`PÁGINA ${i+1} DE ${total}`;page.querySelectorAll('.it-instruction').forEach(tile=>{step++;tile.querySelector('label').textContent='DESCRIÇÃO DA OPERAÇÃO';tile.querySelector('.photo-caption').textContent=`FOTO ${String(step).padStart(2,'0')}`;tile.querySelector('img').alt=`Foto ${step} da instrução`;});});trainingPage.querySelector('.it-page-number').textContent=`PÁGINA ${total-1} DE ${total}`;ppe.setPageNumber(total,total);}
        function sync(){host.querySelectorAll('[data-it-source]').forEach(el=>{el.textContent=fields.get(el.dataset.itSource)?.value||'—';});ppe.setNumber(fields.get('number')?.value||'—');}
        host.querySelector('.it-add-page').onclick=()=>createPage().scrollIntoView({behavior:'smooth',block:'start'});
        host.querySelector('.it-undo-page').onclick=()=>{if(!removed)return;const {page,index}=removed;const position=Math.min(index,pages.length);host.insertBefore(page,pages[position]||trainingPage);pages.splice(position,0,page);removed=null;host.querySelector('.it-removed').hidden=true;update();sync();};
        createPage();
        function snapshot(){return{schema:1,documentType:'IT',fields:Object.fromEntries(Array.from(fields,([key,f])=>[key,{value:f.value,checked:!!f.checked}])),instructions:pages.map(page=>Array.from(page.querySelectorAll('.it-instruction')).map(tile=>({description:tile.querySelector('textarea').value,photo:{src:tile.querySelector('img').getAttribute('src')||'',size:Number(tile.querySelector('.photo-size').value)}}))),training:training.map(({name,shift})=>({name:name.value,shift:shift.value})),ppe:ppe.snapshot()};}
        const initial=snapshot();
        function restore(state){
            if(state?.documentType!=='IT'||state.schema!==1||!state.fields||!Array.isArray(state.instructions)||!state.instructions.length||state.instructions.length>20||state.instructions.some(p=>!Array.isArray(p)||p.length!==4)||state.training?.length!==20)throw Error('Documento IT incompatível.');
            fields.forEach((field,key)=>{const v=state.fields[key];field.value=v?.value||'';if('checked'in field)field.checked=!!v?.checked;});
            while(pages.length>1)pages.pop().remove();removed=null;host.querySelector('.it-removed').hidden=true;
            state.instructions.forEach((steps,index)=>{const page=index?createPage():pages[0];page.querySelectorAll('.it-instruction').forEach((tile,i)=>{const saved=steps[i];tile.querySelector('textarea').value=saved.description;const slot=tile.querySelector('.photo-slot');window.HQSImages.removeImage(slot);if(saved.photo.src)window.HQSImages.applyImage(slot,saved.photo.src);slot.querySelector('.photo-size').value=saved.photo.size;window.HQSImages.resizeImage(slot,saved.photo.size);});});
            training.forEach(({name,shift},i)=>{name.value=state.training[i].name;shift.value=state.training[i].shift;});ppe.restore(state.ppe);sync();update();refreshPrint();
        }
        function refreshPrint(){host.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]),textarea').forEach(field=>{if(field.nextElementSibling?.classList.contains('it-print-value'))field.nextElementSibling.textContent=field.type==='date'&&field.value?field.value.split('-').reverse().join('/'):field.value;});ppe.refreshPrint();}
        window.addEventListener('beforeprint',refreshPrint);
        return{host,snapshot,restore,reset:()=>restore(structuredClone(initial)),meta:()=>({documentType:'IT',str:fields.get('number').value,product:fields.get('part').value,defect:fields.get('technicalDefect').value||fields.get('strDefect').value})};
    }
};
