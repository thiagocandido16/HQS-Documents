/* HQS Documents - três etapas, seis fotos e cabeçalho vinculado à página 1. */
document.addEventListener("DOMContentLoaded", () => {
    const parentWorkspace = document.querySelector(".workspace");
    if (!parentWorkspace || !window.HQSImages) return;
    const workspace = document.createElement('div');
    workspace.className='str-document-host';
    workspace.append(...Array.from(parentWorkspace.childNodes));
    parentWorkspace.appendChild(workspace);
    const firstPage = workspace.querySelector(".document-page");
    const note = workspace.querySelector(".workspace-note");
    const pages = [];
    let stepCounter = 0;
    let pageSerial = 0;
    let trainingPage = null;
    let ppePage = null;
    let removedPage = null;
    const strInputs = Array.from(workspace.querySelectorAll(".document-page .document-number input"));
    strInputs.forEach(input => {
        input.readOnly = false;
        input.placeholder = "Digite o número STR";
        if (input.getAttribute("value") === "STR-2026-052") {
            input.removeAttribute("value");
            if (input.value === "STR-2026-052") input.value = "";
        }
    });
    const historyIndex = workspace.querySelector(".horse-table tbody tr:first-child td:first-child input");
    const syncHistoryIndex = historyIndex && (!historyIndex.value || historyIndex.value === "STR-2026-052");
    if (syncHistoryIndex) {
        historyIndex.removeAttribute("value");
        historyIndex.value = "";
    }
    const horsePage = workspace.querySelectorAll(".document-page")[1];
    if (horsePage) {
        horsePage.classList.add("horse-page");
        const history = horsePage.querySelector(".horse-table tbody");
        if (history) {
            while (history.rows.length < 8) {
                const row = history.insertRow();
                ["text", "text", "date", "text"].forEach((type, index) => {
                    const field = document.createElement("input");
                    field.type = type;
                    field.setAttribute("aria-label", `${["Índice", "Modificação", "Data", "Responsável"][index]} - histórico ${history.rows.length}`);
                    row.insertCell().appendChild(field);
                });
            }
        }
        Array.from(horsePage.querySelectorAll(".section-block")).forEach(section => {
            if (section.querySelector("h3")?.textContent.includes("TAXA DE PEÇAS BLOQUEADAS")) {
                section.classList.add("blocked-rate-section");
            }
        });
    }

    const legacyFieldCount = window.HQSFields.prepare(workspace);
    const styles = document.createElement("style");
    styles.textContent = `
        .horse-page { gap: 7px; }
        .horse-page > * { flex-shrink: 0; }
        .horse-page .section-block { padding: 6px 10px; }
        .horse-page .section-heading { margin-bottom: 7px; }
        .horse-page .horse-table td { height: 25px; }
        .horse-page .horse-table input { padding: 3px; }
        .horse-page .instruction-content { padding: 6px 10px; }
        .horse-page .equipment-item { padding: 6px 10px; }
        .horse-page .safety-grid label { padding: 6px 9px; }
        .horse-page .blocked-rate-section { padding: 5px 8px; }
        .horse-page .blocked-rate-section .section-heading { gap: 6px; margin-bottom: 4px; }
        .horse-page .blocked-rate-section .section-icon { width: 18px; height: 18px; font-size: 8px; border-radius: 4px; }
        .horse-page .blocked-rate-section h3 { font-size: 9px; }
        .horse-page .blocked-rate-section .fields-grid { gap: 6px; }
        .horse-page .blocked-rate-section .field label { margin-bottom: 2px; font-size: 7px; }
        .horse-page .blocked-rate-section .field input { height: 23px; padding: 3px 6px; font-size: 9px; }
        .document-page .horse-logo { position: relative; align-self: stretch; }
        .document-page .horse-logo img { position: absolute; left: -10px; top: -12px; width: 115px; max-width: 100%; max-height: none; height: auto; border-radius: 10px; }
        @media screen and (max-width: 520px) {
            .document-page .horse-logo { min-height: 65px; }
            .document-page .horse-logo img { left: 0; top: 0; width: 105px; }
        }
        .operation-editor { width: min(100%, 210mm); margin: 0 auto 16px; }
        .operation-editor p { font-size: 12px; line-height: 1.5; color: #3b6178; }
        .add-page-button { padding: 10px 16px; border: 0; border-radius: 5px; background: #101d28; color: white; cursor: pointer; font-weight: 700; }
        .operation-page { box-sizing: border-box; width: 210mm; min-height: 297mm; margin: 0 auto 25px; padding: 10mm; background: white; color: #182632; box-shadow: 0 8px 35px #172b3b20; display: flex; flex-direction: column; gap: 6px; font-family: Inter, Arial, sans-serif; }
        .operation-page * { box-sizing: border-box; }
        .operation-page-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 6px; border-bottom: 2px solid #101d28; }
        .operation-page-header h2 { margin: 0; font-size: 13px; line-height: 1.3; }
        .operation-number { white-space: nowrap; font-size: 10px; font-weight: 800; }
        .operation-summary { border: 1px solid #8998a4; font-size: 10px; }
        .operation-identification { display: grid; grid-template-columns: 2fr 1fr; }
        .operation-identification > div { padding: 5px 6px; min-width: 0; overflow-wrap: anywhere; }
        .operation-identification > div + div { border-left: 1px solid #8998a4; }
        .operation-summary-line { padding: 5px 6px; border-top: 1px solid #8998a4; overflow-wrap: anywhere; }
        .operation-manual { display: grid; grid-template-columns: 155px minmax(0, 1fr); gap: 6px; padding: 4px 6px; border-top: 1px solid #8998a4; }
        .operation-manual label { font-weight: 700; padding-top: 4px; }
        .operation-manual textarea { width: 100%; min-height: 34px; padding: 4px; border: 1px solid #dce3e9; border-radius: 3px; resize: vertical; font: inherit; line-height: 1.35; }
        .operation-defect textarea { min-height: 30px; }
        .operation-list { display: grid; gap: 6px; }
        .operation-row { display: grid; grid-template-columns: 3fr 1fr; gap: 0; border: 1px solid #8998a4; break-inside: avoid; }
        .operation-photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; padding: 5px; min-width: 0; }
        .photo-slot { min-width: 0; border: 1px solid #dce3e9; background: #f8fafb; outline: none; }
        .photo-slot:focus-within, .photo-slot:focus { outline: 2px solid #3b6178; outline-offset: -2px; }
        .photo-preview { height: 54mm; padding: 3px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
        .operation-photo { display: none; width: auto; height: auto; max-width: 100%; max-height: 100%; object-fit: contain; }
        .has-image .operation-photo { display: block; }
        .photo-placeholder { padding: 5px; text-align: center; font-size: 10px; line-height: 1.5; color: #71808c; }
        .has-image .photo-placeholder { display: none; }
        .photo-caption { padding: 3px; border-top: 1px solid #dce3e9; text-align: center; font-size: 9px; font-weight: 800; }
        .photo-controls { display: grid; gap: 4px; padding: 5px; border-top: 1px solid #dce3e9; }
        .photo-controls input { width: 100%; min-width: 0; font-size: 9px; }
        .photo-controls label { font-size: 9px; }
        .photo-controls button { padding: 4px; border: 1px solid #cbd5dc; border-radius: 3px; background: white; color: #1d3445; font-size: 9px; cursor: pointer; }
        .photo-status { font-size: 9px; color: #3b6178; min-height: 11px; }
        .operation-description { min-width: 0; padding: 7px; border-left: 1px solid #8998a4; display: flex; flex-direction: column; gap: 6px; }
        .operation-description label { font-size: 10px; font-weight: 800; }
        .operation-description textarea { width: 100%; min-height: 54mm; flex: 1; padding: 5px; border: 1px solid #dce3e9; border-radius: 3px; resize: vertical; font: 11px/1.4 Inter, Arial, sans-serif; color: #182632; }
        .operation-print-text { display: none; }
        .operation-page-footer { margin-top: auto; padding-top: 5px; border-top: 1px solid #8998a4; display: flex; justify-content: space-between; gap: 8px; font-size: 8px; }
        .operation-page-actions { display: flex; justify-content: flex-end; }
        .delete-operation-page, .undo-page { border: 1px solid #cbd5dc; background: white; color: #9b2429; padding: 7px 10px; border-radius: 4px; cursor: pointer; }
        .removed-page-notice { margin-top: 10px; font-size: 12px; }
        .training-page { box-sizing: border-box; width: 210mm; min-height: 297mm; margin: 0 auto 25px; padding: 10mm; background: white; color: #182632; box-shadow: 0 8px 35px #172b3b20; display: flex; flex-direction: column; gap: 8px; font-family: Inter, Arial, sans-serif; }
        .training-page * { box-sizing: border-box; }
        .training-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-bottom: 7px; border-bottom: 2px solid #101d28; }
        .training-header h2 { margin: 0; font-size: 15px; }
        .training-str { font-size: 10px; font-weight: 800; white-space: nowrap; }
        .training-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .training-table th, .training-table td { border: 1px solid #8998a4; padding: 0; vertical-align: middle; }
        .training-table th { background: #edf1f4; color: #101d28; padding: 5px 4px; font-size: 9px; text-align: center; }
        .training-table .training-section { background: #dce3e9; padding: 6px; font-size: 10px; }
        .training-cell { display: flex; align-items: center; min-width: 0; }
        .training-shift { padding: 0 4px; font-size: 9px; font-weight: 700; white-space: nowrap; }
        .training-table textarea { display: block; width: 100%; min-width: 0; height: 26px; min-height: 26px; padding: 5px 4px; border: 0; outline: 0; background: transparent; color: #182632; resize: vertical; font: 10px/1.3 Inter, Arial, sans-serif; }
        .training-table textarea:focus { background: #f0f7fb; box-shadow: inset 0 0 0 1px #3b6178; }
        .training-print-value { display: none; }
        @media screen and (max-width: 850px) {
            .operation-page { width: 100%; padding: 20px; }
            .training-page { width: 100%; padding: 20px; }
        }
        @media screen and (max-width: 520px) {
            .operation-page-header { align-items: flex-start; flex-direction: column; }
            .operation-identification, .operation-row, .operation-manual { grid-template-columns: 1fr; }
            .operation-description { border-left: 0; border-top: 1px solid #8998a4; }
            .operation-identification > div + div { border-left: 0; border-top: 1px solid #8998a4; }
        }
        @media print {
            .operation-editor, .photo-controls, .operation-page-actions { display: none !important; }
            .operation-page { width: 210mm; min-height: 297mm; height: auto; margin: 0; padding: 10mm; box-shadow: none; gap: 5px; break-before: page; break-after: page; page-break-before: always; page-break-after: always; }
            .operation-page:last-of-type { break-after: auto; page-break-after: auto; }
            .operation-page-header, .operation-summary, .operation-page-footer { flex-shrink: 0; }
            .operation-summary { font-size: 10px; }
            .operation-manual { padding: 3px 6px; }
            .operation-manual label { padding-top: 0; }
            .operation-page textarea { display: none; }
            .operation-print-text { display: block; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 10px; line-height: 1.35; min-width: 0; }
            .operation-manual .operation-print-text { min-height: 25px; }
            .operation-list { gap: 4px; }
            .operation-row { min-height: 61mm; break-inside: avoid; page-break-inside: avoid; }
            .operation-photos { padding: 3px; gap: 4px; }
            .photo-preview { height: 54mm; }
            .photo-slot { outline: none !important; background: white; }
            .photo-placeholder { display: none; }
            .photo-caption { padding: 2px; }
            .operation-description { padding: 5px; gap: 4px; }
            .operation-page-footer { break-inside: avoid; }
            .training-page { width: 210mm; min-height: 297mm; height: auto; margin: 0; padding: 10mm; box-shadow: none; break-before: page; page-break-before: always; break-after: auto; }
            .training-table tr { break-inside: avoid; page-break-inside: avoid; }
            .training-table textarea { display: none; }
            .training-print-value { display: block; width: 100%; min-width: 0; min-height: 26px; padding: 4px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 10px; line-height: 1.3; }
        }
    `;
    document.head.appendChild(styles);

    function normalized(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ").trim().toUpperCase();
    }

    function sourceField(labelText) {
        const label = Array.from(firstPage?.querySelectorAll(".field > label, .field-card > label") || [])
            .find(item => normalized(item.textContent) === normalized(labelText));
        return label?.parentElement.querySelector("input, textarea, select");
    }

    const sources = {
        product: sourceField("PRODUTO / PEÇA"),
        start: sourceField("DATA DE ABERTURA"),
        reference: sourceField("REFERÊNCIA(S)"),
        defect: sourceField("MOTIVO"),
        str: firstPage?.querySelector(".document-number input")
    };

    function syncHeader() {
        const values = {};
        strInputs.forEach(input => {
            if (input !== sources.str) input.value = sources.str?.value || "";
        });
        if (syncHistoryIndex) historyIndex.value = sources.str?.value || "";
        for (const [key, input] of Object.entries(sources)) {
            let value = input?.value || "";
            if (key === "start" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                value = value.split("-").reverse().join("/");
            }
            values[key] = value || "—";
        }
        pages.forEach(page => {
            page.querySelectorAll("[data-source]").forEach(output => {
                output.textContent = values[output.dataset.source];
            });
            const defect = page.querySelector(".operation-defect textarea");
            if (defect && page.dataset.defectEdited !== "true") {
                defect.value = sources.defect?.value || "";
                defect.nextElementSibling.textContent = defect.value;
            }
        });
        if (trainingPage) trainingPage.querySelector(".training-str").textContent = values.str;
        if (ppePage) ppePage.setNumber(values.str);
    }

    function addManualField(parent, labelText, id) {
        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = labelText;
        const textarea = document.createElement("textarea");
        textarea.id = id;
        textarea.rows = 2;
        textarea.placeholder = "Preencher manualmente...";
        const mirror = document.createElement("div");
        mirror.className = "operation-print-text";
        mirror.setAttribute("aria-hidden", "true");
        textarea.addEventListener("input", () => { mirror.textContent = textarea.value; });
        parent.append(label, textarea, mirror);
    }

    function createPhotoSlot(number) {
        const slot = document.createElement("div");
        slot.className = "photo-slot";
        slot.tabIndex = 0;
        slot.setAttribute("aria-label", `Foto ${number}. Selecione este espaço e cole uma imagem com Ctrl+V.`);
        slot.innerHTML = `
            <div class="photo-preview">
                <div class="photo-placeholder">Clique aqui e cole com<br><strong>Ctrl + V</strong><br>ou anexe uma imagem abaixo.</div>
                <img class="operation-photo" alt="Foto ${number} da operação">
            </div>
            <div class="photo-caption">FOTO ${String(number).padStart(2, "0")}</div>
            <div class="photo-controls">
                <input type="file" accept="image/*" class="photo-upload" aria-label="Anexar foto ${number}">
                <label for="photo-size-${number}">Tamanho da imagem</label>
                <input id="photo-size-${number}" type="range" min="30" max="100" value="100" class="photo-size">
                <button type="button" class="remove-photo">Remover imagem</button>
                <span class="photo-status" role="status" aria-live="polite"></span>
            </div>`;
        slot.querySelector(".photo-preview").addEventListener("click", () => slot.focus());
        const upload = slot.querySelector(".photo-upload");
        upload.addEventListener("change", () => {
            window.HQSImages.createPreview(upload.files[0], data => window.HQSImages.applyImage(slot, data));
        });
        slot.querySelector(".photo-size").addEventListener("input", event => {
            const image = slot.querySelector(".operation-photo");
            const percent = Math.min(100, Math.max(30, Number(event.target.value) || 100));
            image.style.maxHeight = `${percent}%`;
            image.style.maxWidth = `${percent}%`;
        });
        slot.querySelector(".remove-photo").addEventListener("click", () => {
            window.HQSImages.removeImage(slot);
            upload.value = "";
            slot.querySelector(".photo-size").value = "100";
            slot.querySelector(".operation-photo").style.removeProperty("max-height");
            slot.querySelector(".operation-photo").style.removeProperty("max-width");
        });
        if (window.HQSImages.bindSlot) {
            window.HQSImages.bindSlot(slot);
        } else {
            slot.addEventListener("paste", event => {
                const item = Array.from(event.clipboardData?.items || [])
                    .find(entry => entry.kind === "file" && entry.type.startsWith("image/"));
                if (!item) return;
                event.preventDefault();
                window.HQSImages.createPreview(item.getAsFile(), data => {
                    window.HQSImages.applyImage(slot, data);
                });
            });
        }
        return slot;
    }

    function createOperationRow() {
        const step = ++stepCounter;
        const row = document.createElement("section");
        row.className = "operation-row";
        const photos = document.createElement("div");
        photos.className = "operation-photos";
        photos.append(createPhotoSlot(step * 2 - 1), createPhotoSlot(step * 2));
        const description = document.createElement("div");
        description.className = "operation-description";
        addManualField(description, 'DESCRIÇÃO DA OPERAÇÃO', `operation-step-${step}`);
        row.append(photos, description);
        return row;
    }

    function updatePageNumbers() {
        const total = pages.length + 4;
        let step = 0;
        pages.forEach((page, index) => {
            page.setAttribute("aria-label", `Descrição da operação - página ${index + 3}`);
            page.querySelector(".operation-page-number").textContent = `PÁGINA ${index + 3} DE ${total}`;
            page.querySelectorAll(".operation-row").forEach(row => {
                step++;
                row.querySelector(".operation-description label").textContent = 'DESCRIÇÃO DA OPERAÇÃO';
                row.querySelectorAll(".photo-slot").forEach((slot, photoIndex) => {
                    const number = step * 2 - 1 + photoIndex;
                    slot.querySelector(".photo-caption").textContent = `FOTO ${String(number).padStart(2, "0")}`;
                    slot.querySelector(".operation-photo").alt = `Foto ${number} da operação`;
                    slot.querySelector(".photo-upload").setAttribute("aria-label", `Anexar foto ${number}`);
                    slot.setAttribute("aria-label", `Foto ${number}. Selecione este espaço e cole uma imagem com Ctrl+V.`);
                });
            });
        });
        if (trainingPage) trainingPage.querySelector(".training-page-number").textContent = `PÁGINA ${total - 1} DE ${total}`;
        if (ppePage) ppePage.setPageNumber(total,total);
        workspace.querySelectorAll(".document-page .document-footer > span:last-child")
            .forEach((output, index) => { output.textContent = `PÁGINA ${index + 1} DE ${total}`; });
    }

    function createOperationPage() {
        const number = ++pageSerial + 2;
        const page = document.createElement("article");
        page.className = "operation-page";
        page.setAttribute("aria-label", `Descrição da operação - página ${number}`);
        page.innerHTML = `
            <header class="operation-page-header">
                <h2>DESCRIÇÃO DETALHADA DA TRIAGEM/RETRABALHO/REPARO</h2>
                <span class="operation-number" data-source="str"></span>
            </header>
            <section class="operation-summary" aria-label="Informações da operação">
                <div class="operation-identification">
                    <div><strong>Nome da peça: </strong><span data-source="product"></span></div>
                    <div><strong>Data de início: </strong><span data-source="start"></span></div>
                </div>
                <div class="operation-summary-line"><strong>Referência: </strong><span data-source="reference"></span></div>
                <div class="operation-summary-line"><strong>Defeito: </strong><span data-source="defect"></span></div>
            </section>
            <div class="operation-list"></div>
            <footer class="operation-page-footer">
                <span>RPIF-HGQUA-2024-0021</span>
                <span>Internal Use · Confidential C</span>
                <span class="operation-page-number"></span>
            </footer>`;
        const summary = page.querySelector(".operation-summary");
        if (number > 3) {
            const defectLine = page.querySelector('[data-source="defect"]').parentElement;
            defectLine.replaceChildren();
            defectLine.classList.add("operation-manual", "operation-defect");
            addManualField(defectLine, "Defeito:", `operation-page-${number}-defect`);
            const defect = defectLine.querySelector("textarea");
            defect.rows = 1;
            defect.placeholder = "Informe o defeito desta página...";
            defect.addEventListener("input", () => {
                page.dataset.defectEdited = "true";
            });
        }
        if (number === 3) ["Ponto chave:", "Importância do ponto chave:", "O que é proibido e por quê:"].forEach((label, index) => {
            const field = document.createElement("div");
            field.className = "operation-manual";
            addManualField(field, label, `operation-page-${number}-manual-${index}`);
            summary.appendChild(field);
        });
        const list = page.querySelector(".operation-list");
        for (let i = 0; i < 3; i++) list.appendChild(createOperationRow());
        if (number > 3) {
            const actions = document.createElement("div");
            actions.className = "operation-page-actions";
            actions.innerHTML = '<button type="button" class="delete-operation-page">Excluir esta página</button>';
            actions.querySelector("button").addEventListener("click", () => {
                const index = pages.indexOf(page);
                if (index < 1) return;
                removedPage = { page, index };
                pages.splice(index, 1);
                page.remove();
                editor.querySelector(".removed-page-notice").hidden = false;
                updatePageNumbers();
                editor.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            page.insertBefore(actions, page.firstChild);
        }
        pages.push(page);
        workspace.insertBefore(page, trainingPage || note || null);
        syncHeader();
        updatePageNumbers();
        return page;
    }

    function createTrainingPage() {
        const page = document.createElement("article");
        page.className = "training-page";
        page.setAttribute("aria-label", "Lista de presença de treinamento");
        page.innerHTML = `<header class="training-header"><h2>LISTA DE PRESENÇA DE TREINAMENTO</h2><span class="training-str"></span></header>
            <table class="training-table" aria-label="Presença de líderes e participantes">
                <colgroup><col style="width:30%"><col style="width:18%"><col style="width:12%"><col style="width:22%"><col style="width:18%"></colgroup>
                <tbody></tbody>
            </table>
            <table class="training-table" aria-label="Insumos e químicos"><colgroup><col style="width:48%"><col style="width:32%"><col style="width:20%"></colgroup><tbody></tbody></table>
            <table class="training-table" aria-label="Meios de controle e gabarito"><colgroup><col style="width:28%"><col style="width:34%"><col style="width:20%"><col style="width:18%"></colgroup><tbody></tbody></table>
            <footer class="operation-page-footer"><span>RPIF-HGQUA-2024-0021</span><span>Internal Use · Confidential C</span><span class="training-page-number"></span></footer>`;

        function heading(body, titles, section = false) {
            const row = body.insertRow();
            titles.forEach(title => {
                const cell = document.createElement("th");
                cell.textContent = title;
                cell.scope = section ? "colgroup" : "col";
                if (section) { cell.colSpan = 4; cell.className = "training-section"; }
                row.appendChild(cell);
            });
        }

        function inputRow(body, titles, rowNumber, prefix = "") {
            const row = body.insertRow();
            titles.forEach((title, index) => {
                const cell = row.insertCell();
                const wrap = document.createElement("div");
                wrap.className = "training-cell";
                if (prefix && index === 0) {
                    const shift = document.createElement("span");
                    shift.className = "training-shift";
                    shift.textContent = prefix;
                    wrap.appendChild(shift);
                }
                const field = document.createElement("textarea");
                field.rows = 1;
                field.setAttribute("aria-label", `${title} - linha ${rowNumber}`);
                const mirror = document.createElement("div");
                mirror.className = "training-print-value";
                mirror.setAttribute("aria-hidden", "true");
                field.addEventListener("input", () => { mirror.textContent = field.value; });
                wrap.append(field, mirror);
                cell.appendChild(wrap);
            });
        }

        const bodies = page.querySelectorAll("tbody");
        const leader = ["Nome do LÍDER", "Assinatura", "Data", "Formado por", "Assinatura"];
        const participant = ["Nome do PARTICIPANTE", "Assinatura", "Data", "Formado por", "Assinatura"];
        heading(bodies[0], leader);
        for (let i = 1; i <= 3; i++) inputRow(bodies[0], leader, i, `${i}ºT`);
        heading(bodies[0], participant);
        for (let i = 1; i <= 22; i++) inputRow(bodies[0], participant, i);
        const supplies = ["TIPO DE INSUMO / QUÍMICO", "Responsável pelo fornecimento", "Área"];
        heading(bodies[1], supplies);
        for (let i = 1; i <= 2; i++) inputRow(bodies[1], supplies, i);
        heading(bodies[2], ["MEIOS DE CONTROLE / GABARITO"], true);
        const equipment = ["Nome do meio", "Nº / Rastreabilidade / Desenho", "Meio Horse (S/N)?", "Calibração / N/A"];
        heading(bodies[2], equipment);
        for (let i = 1; i <= 2; i++) inputRow(bodies[2], equipment, i);
        workspace.insertBefore(page, note || null);
        return page;
    }

    Object.values(sources).filter(Boolean).forEach(input => {
        input.addEventListener("input", syncHeader);
        input.addEventListener("change", syncHeader);
    });
    strInputs.filter(input => input !== sources.str).forEach(input => {
        input.addEventListener("input", () => {
            if (sources.str) sources.str.value = input.value;
            syncHeader();
        });
    });
    window.addEventListener("beforeprint", () => {
        syncHeader();
        window.HQSFields.refreshPrint(workspace);
        ppePage?.refreshPrint();
        pages.forEach(page => page.querySelectorAll("textarea").forEach(input => {
            input.nextElementSibling.textContent = input.value;
        }));
        trainingPage?.querySelectorAll("textarea").forEach(input => {
            input.nextElementSibling.textContent = input.value;
        });
    });

    const editor = document.createElement("div");
    editor.className = "operation-editor";
    editor.innerHTML = `<button type="button" class="add-page-button">+ ADICIONAR PÁGINA COM 3 ETAPAS</button>
        <p>Cada página tem três etapas e seis espaços de fotos. Clique no espaço desejado e use Ctrl+V para colar uma imagem copiada, ou use o anexo. Nas páginas adicionadas, o defeito pode ser editado.</p>
        <div class="removed-page-notice" hidden role="status">Página excluída. <button type="button" class="undo-page">Desfazer exclusão</button></div>`;
    editor.querySelector(".add-page-button").addEventListener("click", () => {
        createOperationPage().scrollIntoView({ behavior: "smooth", block: "start" });
    });
    editor.querySelector(".undo-page").addEventListener("click", () => {
        if (!removedPage) return;
        const { page, index } = removedPage;
        const insertionIndex = Math.min(index, pages.length);
        workspace.insertBefore(page, pages[insertionIndex] || trainingPage || note || null);
        pages.splice(insertionIndex, 0, page);
        removedPage = null;
        editor.querySelector(".removed-page-notice").hidden = true;
        syncHeader();
        updatePageNumbers();
        page.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    workspace.insertBefore(editor, note || null);
    trainingPage = createTrainingPage();
    ppePage = window.HQSPPE.create({workspace,before:note || null,documentType:'STR'});
    createOperationPage();

    const staticFields = () => Array.from(workspace.querySelectorAll('[data-field-key]'));
    const snapshot = () => ({
        schema: 2,
        fields: staticFields().map(f => ({key:f.dataset.fieldKey,value:f.value,checked:!!f.checked})),
        operations: pages.map(page => ({
            defectEdited: page.dataset.defectEdited === 'true',
            manuals: Array.from(page.querySelectorAll('.operation-manual textarea')).map(f=>f.value),
            steps: Array.from(page.querySelectorAll('.operation-row')).map(row=>({
                description:row.querySelector('.operation-description textarea').value,
                photos:Array.from(row.querySelectorAll('.photo-slot')).map(slot=>({
                    src:slot.querySelector('img').getAttribute('src') || '',
                    size:Number(slot.querySelector('.photo-size').value)
                }))
            }))
        })),
        training:Array.from(trainingPage.querySelectorAll('textarea')).map(f=>f.value),
        ppe:ppePage.snapshot()
    });
    const initial = snapshot();
    function restore(state) {
        if (![1,2].includes(state?.schema) || !Array.isArray(state.operations) || state.operations.length<1 || state.operations.length>40) throw Error('Documento incompatível.');
        const fields=staticFields();
        if(!Array.isArray(state.fields) || (state.schema===1 && state.fields.length!==legacyFieldCount) || state.training.length!==trainingPage.querySelectorAll('textarea').length) throw Error('Este arquivo usa uma estrutura de formulário diferente.');
        const byKey=new Map(fields.map(field=>[field.dataset.fieldKey,field]));
        fields.forEach(field=>{if(field.type==='checkbox'||field.type==='radio')field.checked=false;else field.value='';});
        state.fields.forEach((value,index)=>{
            const field=byKey.get(state.schema===1?`legacy:${index}`:value.key);
            if(field){field.value=value.value;if('checked' in field)field.checked=!!value.checked;}
        });
        pages.forEach(page=>page.remove());pages.length=0;stepCounter=0;pageSerial=0;removedPage=null;
        editor.querySelector('.removed-page-notice').hidden=true;
        state.operations.forEach(saved=>{
            const page=createOperationPage();
            page.dataset.defectEdited=String(saved.defectEdited);
            page.querySelectorAll('.operation-manual textarea').forEach((f,i)=>{f.value=saved.manuals[i] || '';f.nextElementSibling.textContent=f.value;});
            page.querySelectorAll('.operation-row').forEach((row,i)=>{
                const savedRow=saved.steps[i];
                const text=row.querySelector('textarea');text.value=savedRow.description;text.nextElementSibling.textContent=text.value;
                row.querySelectorAll('.photo-slot').forEach((slot,j)=>{
                    const photo=savedRow.photos[j];
                    if(photo.src) window.HQSImages.applyImage(slot,photo.src);
                    slot.querySelector('.photo-size').value=String(photo.size);
                    const image=slot.querySelector('img');image.style.maxWidth=photo.size+'%';image.style.maxHeight=photo.size+'%';
                });
            });
        });
        trainingPage.querySelectorAll('textarea').forEach((f,i)=>{f.value=state.training[i] || '';f.nextElementSibling.textContent=f.value;});
        ppePage.restore(state.ppe);
        syncHeader();updatePageNumbers();window.HQSFields.refreshPrint(workspace);
    }
    const strController = {
        host: workspace,
        snapshot, restore,
        reset:()=>restore(structuredClone(initial)),
        meta:()=>({str:sources.str?.value||'',product:sources.product?.value||'',defect:sources.defect?.value||''})
    };
    const itController=window.HQSIT.create(parentWorkspace);
    window.HQSDocumentRouter.install({parent:parentWorkspace,str:strController,it:itController});

});
