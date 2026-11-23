import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),publicDir=path.join(root,'public');
const cleanHtml=text=>text.replace(/<meta name="hqs-release" content="[^"]*">/g,'').replace(/<script type="module" src="[^"]*version-notice\.js\?v=[^"]*"><\/script>/g,'');
function files(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]):[];}
const inputs=['public','functions','lib'].flatMap(dir=>files(path.join(root,dir))).filter(file=>path.relative(publicDir,file)!=='version.json').sort();
const hash=crypto.createHash('sha256');
for(const file of inputs){hash.update(path.relative(root,file).replaceAll('\\','/'));let bytes=fs.readFileSync(file);if(/\.(html|js|css|json|sql)$/.test(file)){let text=bytes.toString('utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n');if(file.endsWith('.html'))text=cleanHtml(text);bytes=Buffer.from(text);}hash.update(bytes);}
const release=hash.digest('hex').slice(0,16);
const script=fs.existsSync(path.join(publicDir,'js/version-notice.js'))?'/js/version-notice.js':'./version-notice.js';
for(const file of files(publicDir).filter(file=>file.endsWith('.html'))){let html=cleanHtml(fs.readFileSync(file,'utf8'));html=html.replace('</head>',`<meta name="hqs-release" content="${release}"><script type="module" src="${script}?v=${release}"></script></head>`);fs.writeFileSync(file,html);}
fs.writeFileSync(path.join(publicDir,'version.json'),JSON.stringify({release})+'\n');
console.log('Identificador da versão atualizado: '+release);


