// kajweb/dict 词书只在用户选择时按需下载；本站仅保存与 ECDICT 词库匹配的单词索引。
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="wordbooks.css">');
const WORD_BOOKS=[
  {id:'cet4-core',title:'四级真题核心词',group:'大学英语',count:1162},{id:'cet6-core',title:'六级真题核心词',group:'大学英语',count:1228},{id:'postgraduate-core',title:'考研必考词汇',group:'国内考试',count:1341},{id:'cet4-full',title:'四级英语词汇',group:'大学英语',count:3739},{id:'cet6-full',title:'六级英语词汇',group:'大学英语',count:2078},{id:'ielts',title:'雅思词汇',group:'出国考试',count:3427},{id:'toefl',title:'TOEFL 词汇',group:'出国考试',count:9213},{id:'gre',title:'GRE 词汇',group:'出国考试',count:7199},{id:'sat',title:'SAT 词汇',group:'出国考试',count:4423},{id:'gmat',title:'GMAT 词汇',group:'出国考试',count:3254},{id:'junior',title:'初中英语词汇',group:'教材词汇',count:1420},{id:'senior',title:'高中英语词汇',group:'教材词汇',count:3668}
];
const wordBookStoreKey='englishLabWordbooks';
let selectedWordBook=localStorage.getItem('englishLabSelectedWordbook')||'all',wordBookLoading='';
let importedWordBooks=(()=>{try{return JSON.parse(localStorage.getItem(wordBookStoreKey)||'{}')}catch{return {}}})();
const wordBookSet=id=>new Set(importedWordBooks[id]?.words||[]);
function findZipEnd(view){for(let offset=view.byteLength-22;offset>=Math.max(0,view.byteLength-65557);offset--)if(view.getUint32(offset,true)===0x06054b50)return offset;return -1}
async function inflateZipEntry(bytes,method){if(method===0)return bytes;if(method!==8||typeof DecompressionStream==='undefined')throw new Error('当前浏览器不支持解压这本词书。');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer())}
async function readZipJson(buffer){
  const view=new DataView(buffer),end=findZipEnd(view);if(end<0)throw new Error('词书压缩包格式不正确。');
  let offset=view.getUint32(end+16,true);const entries=view.getUint16(end+10,true),decoder=new TextDecoder();
  for(let index=0;index<entries;index++){
    if(view.getUint32(offset,true)!==0x02014b50)break;
    const method=view.getUint16(offset+10,true),size=view.getUint32(offset+20,true),nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true),localOffset=view.getUint32(offset+42,true),name=decoder.decode(new Uint8Array(buffer,offset+46,nameLength));
    if(name.toLowerCase().endsWith('.json')){const localName=view.getUint16(localOffset+26,true),localExtra=view.getUint16(localOffset+28,true),start=localOffset+30+localName+localExtra,raw=await inflateZipEntry(new Uint8Array(buffer,start,size),method);return JSON.parse(decoder.decode(raw))}
    offset+=46+nameLength+extraLength+commentLength;
  }
  throw new Error('压缩包中没有找到 JSON 词书。');
}
function collectHeadWords(data){const result=new Set(),stack=[data];while(stack.length){const value=stack.pop();if(!value||typeof value!=='object')continue;if(typeof value.headWord==='string'){const name=value.headWord.trim().toLowerCase();if(/^[a-z][a-z '-]{0,44}$/.test(name))result.add(name);continue}if(Array.isArray(value))for(const item of value)stack.push(item);else for(const item of Object.values(value))if(item&&typeof item==='object')stack.push(item)}return result}
async function importWordBook(id){
  const book=WORD_BOOKS.find(item=>item.id===id);if(!book)return;wordBookLoading=id;render();
  try{const response=await fetch(`/api/wordbooks/${encodeURIComponent(id)}`);if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'词书下载失败。')}const sourceWords=collectHeadWords(await readZipJson(await response.arrayBuffer())),available=new Set(WORDS.map(item=>item.w)),words=[...sourceWords].filter(name=>available.has(name));if(!words.length)throw new Error('没有找到可与站内词库匹配的单词。');importedWordBooks[id]={words,sourceCount:sourceWords.size,importedAt:new Date().toISOString()};localStorage.setItem(wordBookStoreKey,JSON.stringify(importedWordBooks));selectedWordBook=id;localStorage.setItem('englishLabSelectedWordbook',id);toast(`已导入《${book.title}》：${words.length} 个可学习单词`)}catch(error){selectedWordBook='all';localStorage.setItem('englishLabSelectedWordbook','all');toast(error.message||'词书导入失败，请稍后再试。')}finally{wordBookLoading='';wordIndex=0;render()}
}
function wordBookOptions(){const groups=[...new Set(WORD_BOOKS.map(item=>item.group))];return `<option value="all">全部站内词汇</option>${groups.map(group=>`<optgroup label="${esc(group)}">${WORD_BOOKS.filter(item=>item.group===group).map(item=>{const imported=importedWordBooks[item.id],label=`${item.title} · ${item.count} 词${imported?` · 已匹配 ${imported.words.length}`:''}`;return `<option value="${item.id}" ${selectedWordBook===item.id?'selected':''}>${esc(label)}</option>`}).join('')}</optgroup>`).join('')}`}
const wordsPageBeforeWordBooks=wordsPage,filteredBeforeWordBooks=filteredVocabularyWords;
filteredVocabularyWords=function(){const words=filteredBeforeWordBooks();if(selectedWordBook==='all')return words;const selected=wordBookSet(selectedWordBook);return words.filter(item=>selected.has(item.w))};
wordsPage=function(){const html=wordsPageBeforeWordBooks(),book=WORD_BOOKS.find(item=>item.id===selectedWordBook),record=importedWordBooks[selectedWordBook],panel=`<div class="wordbook-picker"><div><label for="wordbook-select">${vocabText('选择词书','Choose a word book')}</label><select id="wordbook-select" class="input" ${wordBookLoading?'disabled':''}>${wordBookOptions()}</select></div><p>${wordBookLoading?vocabText('正在下载并识别词书，请稍候……','Downloading and reading the word book…'):book&&record?vocabText(`当前按《${book.title}》学习；原书 ${record.sourceCount} 词，站内可练习 ${record.words.length} 词。`,`Studying ${book.title}: ${record.words.length} matched words.`):vocabText('选择词书后按需导入；释义继续使用站内 ECDICT 数据。','Word books load on demand; definitions still come from the local ECDICT data.')}</p></div>`;return html.replace('<section class="card vocab-filters">',`<section class="card vocab-filters">${panel}`)};
const adaptivePoolBeforeWordBooks=adaptiveGamePool;
adaptiveGamePool=function(){const pool=adaptivePoolBeforeWordBooks();if(selectedWordBook==='all')return pool;const selected=wordBookSet(selectedWordBook);return pool.filter(item=>selected.has(item.w))};
document.addEventListener('change',event=>{if(event.target.id!=='wordbook-select')return;const id=event.target.value;if(id==='all'){selectedWordBook='all';localStorage.setItem('englishLabSelectedWordbook','all');wordIndex=0;render();return}if(importedWordBooks[id]){selectedWordBook=id;localStorage.setItem('englishLabSelectedWordbook',id);wordIndex=0;render();return}importWordBook(id)},true);
