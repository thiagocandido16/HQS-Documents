export const releaseChanged=(current,remote)=>typeof remote==='string'&&remote.length>0&&remote!==current;
export function watchRelease({current,load,onChange,interval=60000}){
 let checking=false,stopped=false;
 async function check(){if(checking||stopped)return;checking=true;try{const remote=await load();if(releaseChanged(current,remote))onChange(remote);}catch{/* Uma falha de conexão não deve interromper o preenchimento. */}finally{checking=false;}}
 const timer=setInterval(check,interval);return {check,stop(){stopped=true;clearInterval(timer);}};
}
if(typeof document!=='undefined'){
 const current=document.querySelector('meta[name="hqs-release"]')?.content;
 if(current){
  let notice;
  const show=()=>{if(notice)return;notice=document.createElement('aside');notice.className='hqs-update-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
   const text=document.createElement('span');text.textContent='Nova versão disponível. Salve seu preenchimento antes de atualizar.';
   const button=document.createElement('button');button.type='button';button.textContent='Atualizar página';
   button.onclick=()=>{if(document.querySelector('#request-form,#control-form')&&!confirm('Confira se salvou ou copiou o preenchimento desta tela. Deseja atualizar a página agora?'))return;location.reload();};
   notice.append(text,button);document.body.append(notice);
  };
  const style=document.createElement('style');style.textContent='.hqs-update-notice{position:fixed!important;inset:auto 18px 18px auto!important;z-index:1000!important;width:min(460px,calc(100vw - 36px))!important;height:auto!important;display:flex!important;align-items:center;gap:14px;padding:14px 16px!important;background:#fff!important;color:#29353d!important;border:1px solid #9aa9b3!important;border-radius:10px;box-shadow:0 4px 20px #29353d20;font:13px/1.5 Arial,sans-serif!important}.hqs-update-notice button{flex-shrink:0;border:1px solid #6a7e8e;background:#f7f7f7;color:#29353d;border-radius:6px;padding:8px 10px;font:inherit;cursor:pointer}@media(max-width:500px){.hqs-update-notice{flex-direction:column;align-items:stretch!important;gap:8px}}';document.head.append(style);
  const watcher=watchRelease({current,load:async()=>{const response=await fetch('/version.json',{cache:'no-store'});if(!response.ok)throw Error('Versão indisponível');return (await response.json()).release;},onChange:show});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)watcher.check();});window.addEventListener('focus',()=>watcher.check());watcher.check();
 }
}

