
/*
 * HQS Documents
 * Página de descrição da operação
 * Gerenciamento de etapas e páginas adicionais.
 */

document.addEventListener("DOMContentLoaded", () => {

    console.log("HQS Documents iniciado.");

    const workspace = document.querySelector(".workspace");
    const note = document.querySelector(".workspace-note");

    let operationPages = [];
    let stepCounter = 0;

    const styles = document.createElement("style");

    styles.textContent = `
        .operation-editor {
            max-width: 1050px;
            margin: 0 auto 25px;
        }

        .operation-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 25px;
            padding: 12mm;
            background: white;
            box-shadow: 0 8px 35px #172b3b20;
            display: flex;
            flex-direction: column;
            gap: 14px;
            position: relative;
        }

        .operation-page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 12px;
            border-bottom: 2px solid #dce3e9;
        }

        .operation-page-header h2 {
            margin: 0;
            color: #101d28;
            font-size: 19px;
        }

        .operation-page-header span {
            color: #71808c;
            font-size: 9px;
            font-weight: 700;
        }

        .operation-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .operation-row {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 12px;
            padding: 10px;
            border: 1px solid #dce3e9;
            border-radius: 7px;
            break-inside: avoid;
            min-height: 108mm;
        }

        .operation-photos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            min-width: 0;
        }

        .photo-slot {
            min-width: 0;
            min-height: 220px;
            border: 1px solid #dce3e9;
            border-radius: 5px;
            background: #f8fafb;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .photo-preview {
            flex: 1;
            min-height: 190px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
        }

        .operation-photo {
            display: block;
            max-width: 100%;
            max-height: 280px;
            width: auto;
            height: auto;
            object-fit: contain;
        }

        .photo-placeholder {
            padding: 12px;
            color: #71808c;
            font-size: 10px;
            text-align: center;
        }

        .photo-slot.has-image .photo-placeholder {
            display: none;
        }

        .photo-caption {
            padding: 7px;
            text-align: center;
            border-top: 1px solid #dce3e9;
            color: #3b6178;
            font-size: 9px;
            font-weight: 800;
        }

        .photo-controls {
            padding: 7px;
            border-top: 1px solid #dce3e9;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .photo-controls button,
        .operation-actions button,
        .add-page-button {
            border: 1px solid #cbd5dc;
            border-radius: 5px;
            background: white;
            color: #1d3445;
            padding: 7px;
            font-size: 9px;
            font-weight: 700;
            cursor: pointer;
        }

        .photo-controls input[type="range"] {
            width: 100%;
        }

        .photo-controls input[type="file"] {
            width: 100%;
            font-size: 9px;
        }

        .operation-description {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .operation-description label {
            color: #101d28;
            font-size: 11px;
            font-weight: 800;
        }

        .operation-description textarea {
            width: 100%;
            flex: 1;
            min-height: 190px;
            resize: vertical;
            border: 1px solid #dce3e9;
            border-radius: 5px;
            padding: 10px;
            color: #182632;
            background: #fafcfd;
            font-family: Inter, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.6;
        }

        .operation-actions {
            display: flex;
            justify-content: flex-end;
            gap: 7px;
            margin-top: auto;
        }

        .add-page-button {
            display: block;
            margin: 15px auto 30px;
            padding: 12px 20px;
            background: #101d28;
            color: white;
            border-color: #101d28;
            font-size: 11px;
        }

        .add-page-button:hover {
            background: #1d3445;
        }

        .operation-page-footer {
            margin-top: auto;
            padding: 9px 12px;
            background: #101d28;
            color: white;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
        }

        @media screen and (max-width: 850px) {
            .operation-page {
                width: 100%;
                min-height: auto;
                padding: 20px;
            }

            .operation-row {
                grid-template-columns: 1fr;
                min-height: auto;
            }
        }

        @media print {
            .operation-editor,
            .operation-actions,
            .photo-controls,
            .add-page-button {
                display: none !important;
            }

            .operation-page {
                width: 210mm;
                height: 297mm;
                min-height: 297mm;
                margin: 0;
                padding: 12mm;
                box-shadow: none;
                border: none;
                overflow: hidden;
                break-after: page;
                page-break-after: always;
            }

            .operation-page:last-child {
                break-after: auto;
                page-break-after: auto;
            }

            .operation-row {
                min-height: 108mm;
            }

            .operation-description textarea {
                border: none;
                background: white;
                resize: none;
                overflow: hidden;
            }

            .photo-slot {
                border: 1px solid #dce3e9;
            }
        }
    `;

    document.head.appendChild(styles);

    function createPhotoSlot(photoNumber) {

        const slot = document.createElement("div");
        slot.className = "photo-slot";

        slot.innerHTML = `
            <div class="photo-preview">
                <div class="photo-placeholder">
                    Clique em selecionar imagem
                </div>
                <img class="operation-photo" alt="Foto da operação">
            </div>

            <div class="photo-caption">
                FOTO ${String(photoNumber).padStart(2, "0")}
            </div>

            <div class="photo-controls">
                <input type="file" accept="image/*" class="photo-upload">

                <label>
                    Tamanho da imagem
                </label>

                <input
                    type="range"
                    min="120"
                    max="450"
                    value="280"
                    class="photo-size"
                >

                <button type="button" class="remove-photo">
                    Remover imagem
                </button>
            </div>
        `;

        const upload = slot.querySelector(".photo-upload");

        upload.addEventListener("change", (event) => {

            const file = event.target.files[0];

            window.HQSImages.createPreview(file, (imageData) => {
                window.HQSImages.applyImage(slot, imageData);
            });

        });

        slot.querySelector(".photo-size").addEventListener("input", (event) => {
            window.HQSImages.resizeImage(slot, event.target.value);
        });

        slot.querySelector(".remove-photo").addEventListener("click", () => {
            window.HQSImages.removeImage(slot);
            upload.value = "";
        });

        return slot;
    }

    function createOperationRow() {

        stepCounter++;

        const row = document.createElement("section");
        row.className = "operation-row";

        const photos = document.createElement("div");
        photos.className = "operation-photos";

        photos.appendChild(createPhotoSlot((stepCounter * 2) - 1));
        photos.appendChild(createPhotoSlot(stepCounter * 2));

        const description = document.createElement("div");
        description.className = "operation-description";

        description.innerHTML = `
            <label>
                ${stepCounter}. DESCRIÇÃO DA OPERAÇÃO
            </label>

            <textarea
                placeholder="Descreva detalhadamente a atividade realizada nesta etapa..."
            ></textarea>
        `;

        row.appendChild(photos);
        row.appendChild(description);

        return row;
    }

    function updatePageNumbers() {

        const total = operationPages.length;

        operationPages.forEach((page, index) => {

            const number = page.querySelector(".operation-page-number");

            number.textContent = `PÁGINA ${index + 3} DE ${total + 2}`;

        });

    }

    function createOperationPage() {

        const page = document.createElement("article");
        page.className = "operation-page";

        page.innerHTML = `
            <header class="operation-page-header">
                <div>
                    <span>HQS DOCUMENTS · SOLICITAÇÃO DE TRABALHO</span>
                    <h2>Descrição detalhada da operação</h2>
                </div>

                <span>HORSE</span>
            </header>

            <div class="operation-list"></div>

            <footer class="operation-page-footer">
                <strong>HQS · HORSE QUALITY SYSTEM</strong>
                <span>DOCUMENTO INTERNO</span>
                <span class="operation-page-number"></span>
            </footer>
        `;

        const list = page.querySelector(".operation-list");

        list.appendChild(createOperationRow());
        list.appendChild(createOperationRow());

        operationPages.push(page);

        if (note) {
            workspace.insertBefore(page, note);
        } else {
            workspace.appendChild(page);
        }

        updatePageNumbers();

        return page;
    }

    function addOperationPage() {
        createOperationPage();
    }

    const editor = document.createElement("div");
    editor.className = "operation-editor";

    const addPageButton = document.createElement("button");
    addPageButton.type = "button";
    addPageButton.className = "add-page-button";
    addPageButton.textContent = "+ ADICIONAR PÁGINA";

    addPageButton.addEventListener("click", addOperationPage);

    editor.appendChild(addPageButton);

    if (note) {
        workspace.insertBefore(editor, note);
    } else {
        workspace.appendChild(editor);
    }

    // Cria a primeira página de descrição da operação.
    createOperationPage();

    console.log("Página de descrição da operação carregada.");

});
