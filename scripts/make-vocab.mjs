// 从已授权的 ECDICT 派生词表生成精简的离线词库。
import {readFile,writeFile} from 'node:fs/promises';
const [cet4Path,cet6Path]=process.argv.slice(2);
if(!cet4Path||!cet6Path)throw new Error('请提供四级和六级 JSON 文件路径');
const cet4=JSON.parse(await readFile(cet4Path,'utf8')).words;
const cet6=JSON.parse(await readFile(cet6Path,'utf8')).words;
const entries=new Map();
for(const [rows,level] of [[cet4,'CET4'],[cet6,'CET6']])for(const row of rows){
  const name=String(row.word||'').trim().toLowerCase();
  if(!/^[a-z][a-z -]*$/.test(name)||name.length>45)continue;
  const translation=(row.translations||[]).find(item=>item&&!item.startsWith('['))||row.translations?.[0]||'';
  if(!translation)continue;
  const current=entries.get(name);
  if(current){if(!current[3].includes(level))current[3].push(level);continue}
  const phonetic=String(row.phonetic||'').replaceAll('ә','ə').replaceAll(':','ː').slice(0,70);
  entries.set(name,[name,phonetic,String(translation).slice(0,130),[level]]);
}
const data=[...entries.values()].sort((a,b)=>a[0].localeCompare(b[0]));
const output=`// ECDICT 派生词库，MIT 授权；来源与许可证见 LICENSES/。\nconst VOCAB_LIBRARY=${JSON.stringify(data)};\n`;
await writeFile(new URL('../dist/vocab-data.js',import.meta.url),output);
console.log(`生成 ${data.length} 个去重词条`);
