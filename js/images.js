
/*
 * HQS Documents - Gerenciamento de imagens
 * Carregamento, visualização e ajuste das fotografias.
 */

window.HQSImages = (() => {

    function createPreview(file, callback) {
        if (!file || !file.type.startsWith("image/")) {
            alert("Selecione um arquivo de imagem válido.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            callback(event.target.result);
        };

        reader.onerror = () => {
            alert("Não foi possível carregar a imagem.");
        };

        reader.readAsDataURL(file);
    }

    function applyImage(container, imageData) {
        const image = container.querySelector(".operation-photo");

        if (!image) return;

        image.src = imageData;
        container.classList.add("has-image");
    }

    function removeImage(container) {
        const image = container.querySelector(".operation-photo");

        if (!image) return;

        image.removeAttribute("src");
        container.classList.remove("has-image");
    }

    function resizeImage(container, value) {
        const image = container.querySelector(".operation-photo");

        if (!image) return;

        image.style.maxHeight = `${value}px`;
    }

    return {
        createPreview,
        applyImage,
        removeImage,
        resizeImage
    };

})();
