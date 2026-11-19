export async function api(body){
 const response=await fetch('/api/requests',{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{throw Error('Não foi possível acessar o controle compartilhado.');}
 if(!response.ok)throw Error(data.error||'Não foi possível salvar. Confira a conexão e tente novamente.');return data;
}
export async function connectShared(){
 const config=await fetch('config.json',{cache:'no-store'});if(!config.ok)return null;
 const value=await config.json();if(value.mode!=='shared')return null;
 return api();
}

