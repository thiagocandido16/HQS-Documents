/* Folha compartilhável de EPIs; reutilizável nos modelos STR e IT. */
window.HQSPPE = {
    create({ workspace, before = null, documentType = 'STR' }) {
        const items = [
            'Luva PU', 'Bota de segurança',
            'Luvas anticorte', 'Colete refletivo e/ou similar',
            'Luva PVC manga longa', 'Touca para solda',
            'Luva nitrílica', 'Mangote (se usar estilete)',
            'Máscara PFF2 para fumos metálicos', 'Mangote (se a peça for cortante)',
            'Máscara de proteção', 'Óculos de proteção',
            'Viseira (se levantar a peça na altura do rosto)', 'Capacete e/ou casquete (picking)',
            'Avental anticorte', 'Máscara com filtro (contato com álcool)',
            'Avental de raspa (retífica)', 'Luva de vaqueta',
            'Avental PVC', 'Protetor auricular plug',
            'Protetor de solda canelas', 'Touca balaclava raspa/couro',
            'Cinto ergonômico', 'Calçado de segurança'
        ];
        const page = document.createElement('article');
        page.className = 'ppe-page';
        page.setAttribute('aria-label', 'Descrição de EPIs para a atividade');
        page.innerHTML = `<header class="ppe-header"><div><span>HORSE QUALITY SYSTEM</span><h2>DESCRIÇÃO DE EPIs PARA ATIVIDADE DE ${documentType}</h2></div><strong class="ppe-document-number"></strong></header>
            <section class="ppe-observations"><h3>Observações</h3><p>Conforme os devidos fins, os equipamentos relacionados abaixo são obrigatórios para esta atividade de ${documentType}, de acordo com a Norma Regulamentadora nº 6, da Portaria 3.214/78, art. 166, da Lei 6.514, de 22.12.77, conforme orientação do Técnico em Segurança do Trabalho.</p><p>Todo colaborador deve ser orientado e treinado quanto à obrigatoriedade e ao uso correto dos equipamentos, bem como para solicitar a sua substituição sempre que se tornarem impróprios para uso.</p></section>
            <section class="ppe-identification" aria-label="Local da atividade"><div class="ppe-sites"><strong>Local</strong></div><label class="ppe-sector">Setor</label></section>
            <section><h3 class="ppe-section-title">DISCRIMINAÇÃO DOS EPIs PARA A ATIVIDADE</h3><p class="ppe-guidance">Preenchimento somente pelo(a) Técnico(a) de Segurança IN-HAUS.</p><div class="ppe-list"></div></section>
            <section><h3 class="ppe-section-title">EPIs ADICIONAIS</h3><div class="ppe-additional"></div></section>
            <section class="ppe-responsible"><div class="ppe-signature-space">Assinatura do(a) responsável técnico(a)</div><label class="ppe-technician">Nome</label><label class="ppe-qualification">Função</label><label class="ppe-registration">Registro MTE</label></section>
            <footer class="operation-page-footer"><span>RPIF-HGQUA-2024-0021</span><span>Internal Use · Confidential C</span><span class="ppe-page-number"></span></footer>`;

        function textField(parent, label, value = '') {
            const field = document.createElement('input');
            field.type = 'text'; field.value = value;
            field.setAttribute('aria-label', label);
            const mirror = document.createElement('span');
            mirror.className = 'ppe-print-value'; mirror.setAttribute('aria-hidden', 'true');
            mirror.textContent = value;
            field.addEventListener('input', () => { mirror.textContent = field.value; });
            parent.append(field, mirror);
            return field;
        }
        const sites = {};
        ['CVP', 'CMO', 'CVU'].forEach(name => {
            const label = document.createElement('label'), field = document.createElement('input');
            field.type = 'checkbox';field.setAttribute('aria-label',name);
            label.append(field, document.createTextNode(name));
            page.querySelector('.ppe-sites').appendChild(label);sites[name]=field;
        });
        const sector = textField(page.querySelector('.ppe-sector'), 'Setor da atividade');
        const technician = textField(page.querySelector('.ppe-technician'), 'Nome do responsável técnico', 'Maria Do Carmo Matos Da Silva');
        const qualification = textField(page.querySelector('.ppe-qualification'), 'Função do responsável técnico', 'Técnica em Segurança do Trabalho');
        const registration = textField(page.querySelector('.ppe-registration'), 'Registro MTE', '0028804/PR');
        const checks = items.map((name, index) => {
            const label = document.createElement('label');label.className='ppe-item';
            const field = document.createElement('input');field.type='checkbox';
            field.setAttribute('aria-label',name);
            const text = document.createElement('span');text.textContent=`${index+1}. ${name}`;
            label.append(field,text);page.querySelector('.ppe-list').appendChild(label);return field;
        });
        let extraFields = [];
        function additionalRows(values = []) {
            const list=page.querySelector('.ppe-additional');list.replaceChildren();extraFields=[];
            for(let i=0;i<Math.max(10,values.length);i++) {
                const wrap=document.createElement('div');wrap.className='ppe-extra-item';
                const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';
                check.checked=!!values[i]?.checked;check.setAttribute('aria-label',`Selecionar EPI adicional ${i+1}`);
                const number=document.createElement('span');number.textContent=`${items.length+i+1}.`;
                label.append(check,number);wrap.appendChild(label);
                const name=textField(wrap,`Nome do EPI adicional ${i+1}`,values[i]?.name || '');
                name.placeholder='Preencher se necessário';
                list.appendChild(wrap);extraFields.push({check,name});
            }
        }
        additionalRows();
        function migrate() {
            checks.forEach(check=>{check.checked=false;});
            Object.values(sites).forEach(field=>{field.checked=false;});sector.value='';
            technician.value='Maria Do Carmo Matos Da Silva';qualification.value='Técnica em Segurança do Trabalho';registration.value='0028804/PR';
            const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
            const extras=[];
            workspace.querySelectorAll('.str-retained-fields .safety-grid label').forEach(label=>{
                const check=label.querySelector('input[type="checkbox"]');
                const nameField=label.querySelector('input[type="text"]');
                const name=nameField?.value?.trim() || (nameField ? '' : label.textContent.replace(/^\s*\d+\s*-\s*/, '').trim());
                if(!check?.checked && !nameField?.value?.trim())return;
                const match=items.findIndex(item=>normalize(item)===normalize(name));
                if(match>=0)checks[match].checked=check.checked;
                else extras.push({name:name||'EPI registrado anteriormente',checked:!!check.checked});
            });
            additionalRows(extras);refreshPrint();
        }
        function restore(state) {
            if(!state){migrate();return;}
            if(state.schema!==1 || state.fixed?.length!==items.length || !Array.isArray(state.additional)||state.additional.length>50)throw Error('Folha de EPIs incompatível.');
            checks.forEach((check,i)=>{check.checked=!!state.fixed[i];});
            Object.keys(sites).forEach(name=>{sites[name].checked=!!state.sites?.[name];});
            sector.value=state.sector||'';technician.value=state.technician||'';qualification.value=state.qualification||'';registration.value=state.registration||'';
            additionalRows(state.additional);refreshPrint();
        }
        function snapshot() {
            return {schema:1,sites:Object.fromEntries(Object.entries(sites).map(([name,field])=>[name,field.checked])),sector:sector.value,
                technician:technician.value,qualification:qualification.value,registration:registration.value,
                fixed:checks.map(check=>check.checked),additional:extraFields.map(({check,name})=>({checked:check.checked,name:name.value}))};
        }
        function refreshPrint() {
            page.querySelectorAll('input[type="text"]').forEach(field=>{field.nextElementSibling.textContent=field.value;});
        }
        workspace.insertBefore(page,before);
        return {element:page,snapshot,restore,refreshPrint,
            setNumber(value){page.querySelector('.ppe-document-number').textContent=value;},
            setPageNumber(number,total){page.querySelector('.ppe-page-number').textContent=`PÁGINA ${number} DE ${total}`;}};
    }
};
