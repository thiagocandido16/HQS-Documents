/* Campos STR com identificação estável para documentos antigos e novos. */
window.HQSFields = {
    prepare(workspace) {
        const oldFields = Array.from(workspace.querySelectorAll('.document-page input, .document-page select, .document-page textarea'));
        oldFields.forEach((field, index) => { field.dataset.fieldKey = `legacy:${index}`; });
        const archive = document.createElement('div');
        archive.hidden = true;
        archive.className = 'str-retained-fields';
        archive.setAttribute('aria-hidden', 'true');
        workspace.appendChild(archive);

        const firstPage = workspace.querySelector('.document-page');
        const labelFor = text => Array.from(firstPage.querySelectorAll('.field > label'))
            .find(label => label.textContent.trim() === text);
        function multiline(field, name, key, original) {
            field.classList.add('large-product-field');
            const label = field.querySelector('label');
            label.textContent = name;
            const area = document.createElement('textarea');
            area.rows = 3;
            area.id = key.replace(/[^a-z0-9]/gi, '-');
            area.dataset.fieldKey = key;
            area.setAttribute('aria-label', name);
            label.htmlFor = area.id;
            const print = document.createElement('div');
            print.className = 'field-print-value';
            print.setAttribute('aria-hidden', 'true');
            area.addEventListener('input', () => { print.textContent = area.value; });
            if (original) {
                area.value = original.value;
                print.textContent = area.value;
                original.replaceWith(area);
            } else {
                field.appendChild(area);
            }
            field.appendChild(print);
            return area;
        }

        const reference = labelFor('REFERÊNCIA(S)')?.parentElement;
        if (reference) {
            reference.closest('.section-block').classList.add('product-identification');
            const original = reference.querySelector('input');
            const area = multiline(reference, 'REFERÊNCIA(S)', original.dataset.fieldKey, original);
            area.placeholder = 'Informe uma ou mais referências...';
        }
        const origin = labelFor('ORIGEM FORNECEDOR')?.parentElement;
        if (origin) {
            // Retém o valor legado sem convertê-lo indevidamente em cobrança.
            archive.appendChild(origin.querySelector('input'));
            const area = multiline(origin, 'COBRANÇA CLIENTE (PREENCHIMENTO APENAS SQF)', 'str:billing-client');
            area.placeholder = 'Informe os clientes / fornecedores para cobrança...';
        }

        // Retém dados de documentos antigos sem exibir o campo descontinuado.
        const provisional = labelFor('OPERAÇÃO PROVISÓRIA')?.parentElement;
        if (provisional) archive.appendChild(provisional);
        firstPage.querySelectorAll('.approval-field').forEach(field => {
            if (field.querySelector('span')?.textContent.trim() === 'OPERAÇÃO PROVISÓRIA') {
                const grid = field.parentElement;
                field.remove();
                grid.classList.add('approval-without-provisional');
            }
        });

        const horsePage = workspace.querySelectorAll('.document-page')[1];
        if (horsePage) {
            const sections = Array.from(horsePage.querySelectorAll('.section-block'));
            const unused = sections.find(section => section.querySelector('h3')?.textContent.includes('TAXA DE PEÇAS BLOQUEADAS'));
            if (unused) archive.appendChild(unused);
            const safety = sections.find(section => section.querySelector('.safety-grid'));
            if (safety) {
                safety.classList.add('safety-section');
                const grid = safety.querySelector('.safety-grid');
                for (let number = 6; number <= 15; number++) {
                    const label = document.createElement('label');
                    const index = document.createElement('span');
                    index.textContent = `${number}-`;
                    const check = document.createElement('input');
                    check.type = 'checkbox';
                    check.dataset.fieldKey = `str:safety:${number}:checked`;
                    check.setAttribute('aria-label', `Selecionar equipamento de segurança ${number}`);
                    label.append(index, check);
                    if (number <= 7) {
                        label.append(document.createTextNode(number === 6 ? 'Mangote' : 'Capacete/casquete'));
                    } else {
                        label.className = 'custom-safety-item';
                        const name = document.createElement('input');
                        name.type = 'text';
                        name.dataset.fieldKey = `str:safety:${number}:name`;
                        name.placeholder = `Item ${number} — preencher`;
                        name.setAttribute('aria-label', `Nome do equipamento de segurança ${number}`);
                        label.appendChild(name);
                    }
                    grid.appendChild(label);
                }
                // As marcações antigas ficam retidas para compatibilidade e migração.
                archive.appendChild(safety);
            }
            // Mantém a sequência visual das seções após retirar o antigo item 04.
            horsePage.querySelectorAll('.section-block .section-icon').forEach((icon, i) => {
                icon.textContent = String(i + 1).padStart(2, '0');
            });
        }
        return oldFields.length;
    },
    refreshPrint(workspace) {
        workspace.querySelectorAll('.large-product-field textarea').forEach(field => {
            field.nextElementSibling.textContent = field.value;
        });
    }
};
