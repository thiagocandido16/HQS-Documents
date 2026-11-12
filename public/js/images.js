/* HQS Documents - anexos e imagens coladas com Ctrl+V. */
window.HQSImages = (() => {
    let pending = 0;
    function createPreview(file, callback) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Selecione ou copie um arquivo de imagem válido.");
            return;
        }
        const reader = new FileReader();
        pending++;
        reader.onload = () => { pending--; callback(reader.result); };
        reader.onerror = () => { pending--; alert("Não foi possível carregar a imagem."); };
        reader.readAsDataURL(file);
    }

    function applyImage(container, imageData) {
        const image = container.querySelector(".operation-photo");
        if (!image) return;
        image.src = imageData;
        container.classList.add("has-image");
        const status = container.querySelector(".photo-status");
        if (status) status.textContent = "Imagem carregada.";
        container.dispatchEvent(new Event("hqs-photochange", { bubbles: true }));
    }

    function removeImage(container) {
        const image = container.querySelector(".operation-photo");
        if (!image) return;
        image.removeAttribute("src");
        image.style.removeProperty("max-height");
        image.style.removeProperty("max-width");
        container.classList.remove("has-image");
        const upload = container.querySelector(".photo-upload");
        const size = container.querySelector(".photo-size");
        if (upload) upload.value = "";
        if (size) size.value = "100";
        const status = container.querySelector(".photo-status");
        if (status) status.textContent = "Imagem removida.";
    }

    function resizeImage(container, value) {
        const image = container.querySelector(".operation-photo");
        if (!image) return;
        const percent = Math.min(100, Math.max(30, Number(value) || 100));
        image.style.maxHeight = `${percent}%`;
        image.style.maxWidth = `${percent}%`;
    }

    function bindSlot(container) {
        container.addEventListener("paste", event => {
            // Texto colado em outros campos continua com o comportamento normal.
            const files = Array.from(event.clipboardData?.items || [])
                .filter(item => item.kind === "file" && item.type.startsWith("image/"))
                .map(item => item.getAsFile())
                .filter(Boolean);
            if (!files.length) return;
            event.preventDefault();
            const slots = Array.from(container.closest(".operation-photos")
                .querySelectorAll(".photo-slot"));
            const targets = slots.slice(slots.indexOf(container));
            files.slice(0, targets.length).forEach((file, index) => {
                createPreview(file, data => applyImage(targets[index], data));
            });
        });
    }

    return { createPreview, applyImage, removeImage, resizeImage, bindSlot, isLoading: () => pending > 0 };
})();
