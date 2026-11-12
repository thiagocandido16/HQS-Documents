function checkedPPE(p) {
    if (p === undefined)
        return;
    if (!p || p.schema !== 1 || !Array.isArray(p.fixed) || p.fixed.length !== 24 || p.fixed.some((v) => typeof v !== "boolean") || !Array.isArray(p.additional) || p.additional.length < 10 || p.additional.length > 50 || !p.sites || ["CVP", "CMO", "CVU"].some(k => typeof p.sites[k] !== "boolean"))
        throw Error("Folha de EPIs inválida.");
    const string = (v) => { if (typeof v !== "string" || v.length > 20000)
        throw Error("Texto inválido."); };
    [p.sector, p.technician, p.qualification, p.registration].forEach(string);
    p.additional.forEach((item) => { string(item?.name); if (typeof item.checked !== "boolean")
        throw Error("EPI adicional inválido."); });
}
function checkedIT(s) {
    if (s.schema !== 1 || !s.fields || typeof s.fields !== "object" || Array.isArray(s.fields) || Object.keys(s.fields).length > 40 || !Array.isArray(s.instructions) || s.instructions.length < 1 || s.instructions.length > 20 || !Array.isArray(s.training) || s.training.length !== 20)
        throw Error("Documento IT inválido.");
    const string = (v) => { if (typeof v !== "string" || v.length > 20000)
        throw Error("Texto inválido."); };
    const allowed = new Set(['number', 'reference', 'part', 'motor', 'csrYes', 'csrNo', 'technicalDefect', 'strDefect', 'markPilot', 'markIndustrial', 'markLabel', 'markOther', 'markOtherText', 'containment', 'containmentDetails', 'sampling', 'samplingDetails', 'rework', 'parameterization', 'start', 'costCenter', 'requester', 'area']);
    for (const [key, f] of Object.entries(s.fields)) {
        if (!allowed.has(key) || !f || typeof f.checked !== "boolean")
            throw Error("Campo IT inválido.");
        string(f.value);
    }
    if (Object.keys(s.fields).length !== allowed.size)
        throw Error("Campos da IT incompletos.");
    for (const steps of s.instructions) {
        if (!Array.isArray(steps) || steps.length !== 4)
            throw Error("Página IT inválida.");
        for (const step of steps) {
            string(step?.description);
            const photo = step?.photo;
            if (!photo || typeof photo.src !== "string" || (photo.src && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photo.src)) || !Number.isFinite(photo.size) || photo.size < 30 || photo.size > 100)
                throw Error("Foto IT inválida.");
        }
    }
    s.training.forEach((person) => { string(person?.name); string(person?.shift); });
    checkedPPE(s.ppe);
}
export function checkedState(s) {
    if (s?.documentType === 'IT') {
        checkedIT(s);
        return;
    }
    if (s?.documentType && s.documentType !== 'STR')
        throw Error("Tipo de documento inválido.");
    if (!s || ![1, 2].includes(s.schema) || !Array.isArray(s.fields) || s.fields.length > 500 || !Array.isArray(s.operations) || s.operations.length < 1 || s.operations.length > 40 || !Array.isArray(s.training) || s.training.length > 250)
        throw Error("Formato de documento inválido.");
    const string = (v) => { if (typeof v !== "string" || v.length > 20000)
        throw Error("Texto inválido."); };
    const keys = new Set();
    for (const f of s.fields) {
        string(f?.value);
        if (typeof f.checked !== "boolean")
            throw Error("Campo inválido.");
        if (s.schema === 2) {
            if (typeof f.key !== "string" || !/^(legacy:\d+|str:billing-client|str:safety:(?:[6-9]|1[0-5]):(?:checked|name))$/.test(f.key) || keys.has(f.key))
                throw Error("Identificação de campo inválida.");
            keys.add(f.key);
        }
    }
    s.training.forEach(string);
    checkedPPE(s.ppe);
    for (const p of s.operations) {
        if (!Array.isArray(p.manuals) || p.manuals.length > 4 || !Array.isArray(p.steps) || p.steps.length !== 3 || typeof p.defectEdited !== "boolean")
            throw Error("Página inválida.");
        p.manuals.forEach(string);
        for (const step of p.steps) {
            string(step.description);
            if (!Array.isArray(step.photos) || step.photos.length !== 2)
                throw Error("Fotos inválidas.");
            for (const photo of step.photos) {
                if (typeof photo.src !== "string" || (photo.src && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photo.src)))
                    throw Error("Use fotos PNG, JPEG, WEBP ou GIF.");
                if (!Number.isFinite(photo.size) || photo.size < 30 || photo.size > 100)
                    throw Error("Tamanho de foto inválido.");
            }
        }
    }
}
