/* Preenchimento inicial por solicitação; documentos existentes são abertos sem sobrescrita. */
window.HQSRequestPrefill={
 apply(record){
  const write=(input,value)=>{if(!input||value===undefined||value===null)return;if(input.tagName==='SELECT'&&![...input.options].some(o=>o.value===String(value)))input.add(new Option(String(value),String(value)));input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
  if(record.type==='IT'){
   const values={number:record.number,reference:record.reference,part:record.description,motor:record.motor,technicalDefect:record.defect,strDefect:record.defect,costCenter:record.costCenter,requester:record.responsible,area:record.department};
   for(const [key,value] of Object.entries(values))write(document.getElementById('it-'+key),value);
  }else{
   const host=document.querySelector('.str-document-host');write(host.querySelector('[aria-label="Número STR"]'),record.number);
   const values={'PRODUTO / PEÇA':record.description,'VEÍCULO / MOTOR':record.motor,'FORNECEDOR':record.supplier,'REFERÊNCIA(S)':record.reference,'MOTIVO':record.defect,'Nº SQUALL':record.squall,'CENTRO DE CUSTO':record.costCenter,'SOLICITANTE':record.responsible};
   for(const [label,value] of Object.entries(values)){const name=[...host.querySelectorAll('.field > label')].find(el=>el.textContent.trim()===label);write(name?.parentElement.querySelector('input,select,textarea'),value);}
  }
  const host=document.querySelector(record.type==='IT'?'.it-document-host':'.str-document-host');
  const csr=host.querySelector(record.type==='IT'?(record.csr==='SIM'?'[aria-label="SIM"]':'[aria-label="NÃO"]'):`input[name="csr"][value="${record.csr==='SIM'?'sim':'nao'}"]`);
  if(csr){csr.checked=true;csr.dispatchEvent(new Event('change',{bubbles:true}));}
 }
};

