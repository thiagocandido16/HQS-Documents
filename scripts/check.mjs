import './release.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const base = new URL('../', import.meta.url);
function files(dir) { return fs.readdirSync(dir, { withFileTypes:true }).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]); }
const root = fileURLToPath(base);
for (const file of [...files(path.join(root,'public')), ...files(path.join(root,'functions')), ...files(path.join(root,'lib'))]) {
  if(file.endsWith('.js')) execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
for (const entry of ['index.html','editor.html']) {
  const html=fs.readFileSync(new URL('../public/'+entry,import.meta.url),'utf8');
  for (const [,ref] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if(/^(?:https?:|data:|mailto:)/.test(ref))continue;
    if(!fs.existsSync(new URL('../public/'+ref,import.meta.url)))throw Error('Arquivo ausente: '+ref);
  }
}
const code=fs.readFileSync(new URL('../functions/api/documents.js',import.meta.url),'utf8');
if(code.includes('cloudflare:workers')||code.includes('chatgpt-auth'))throw Error('Dependência antiga no servidor.');
console.log('JavaScript e arquivos do editor conferidos. Configuração do Supabase será feita no painel.');


