// kajweb/dict 词书只在用户选择时按需下载；词书自带内容可直接学习，ECDICT 仅补充已有词条。
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="wordbooks.css">');
const WORD_BOOKS=[
  {id:'cet4-core',title:'四级真题核心词',group:'大学英语',count:1162},{id:'cet6-core',title:'六级真题核心词',group:'大学英语',count:1228},{id:'postgraduate-core',title:'考研必考词汇',group:'国内考试',count:1341},{id:'cet4-full',title:'四级英语词汇',group:'大学英语',count:3739},{id:'cet6-full',title:'六级英语词汇',group:'大学英语',count:2078},{id:'ielts',title:'雅思词汇',group:'出国考试',count:3427},{id:'toefl',title:'TOEFL 词汇',group:'出国考试',count:9213},{id:'gre',title:'GRE 词汇',group:'出国考试',count:7199},{id:'sat',title:'SAT 词汇',group:'出国考试',count:4423},{id:'gmat',title:'GMAT 词汇',group:'出国考试',count:3254},{id:'junior',title:'初中英语词汇',group:'教材词汇',count:1420},{id:'senior',title:'高中英语词汇',group:'教材词汇',count:3668}
];
const wordBookStoreKey='englishLabWordbooks';
let selectedWordBook=localStorage.getItem('englishLabSelectedWordbook')||'all',wordBookLoading='';
let importedWordBooks=(()=>{try{return JSON.parse(localStorage.getItem(wordBookStoreKey)||'{}')}catch{return {}}})();
const wordBookSet=id=>new Set(importedWordBooks[id]?.words||[]);
const wordBookLevels=id=>id.startsWith('cet4')?['CET4']:id.startsWith('cet6')?['CET6']:id==='postgraduate-core'?['KY']:id==='ielts'?['IELTS']:id==='toefl'?['TOEFL']:id==='gre'?['GRE']:[];
function addImportedEntries(entries=[]){for(const entry of entries){const [w,ipa,zh,def,ex,exzh,bookId]=entry;if(!WORDS.some(item=>item.w===w))WORDS.push({w,ipa,zh,def,ex,exzh,cat:'General',levels:wordBookLevels(bookId),scenes:[],tracks:[],cefr:''})}}
for(const record of Object.values(importedWordBooks))addImportedEntries(record.entries);
function findZipEnd(view){for(let offset=view.byteLength-22;offset>=Math.max(0,view.byteLength-65557);offset--)if(view.getUint32(offset,true)===0x06054b50)return offset;return -1}
async function inflateZipEntry(bytes,method){if(method===0)return bytes;if(method!==8||typeof DecompressionStream==='undefined')throw new Error('当前浏览器不支持解压这本词书。');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(stream).arrayBuffer())}
async function readZipJson(buffer){
  const view=new DataView(buffer),end=findZipEnd(view);if(end<0)throw new Error('词书压缩包格式不正确。');
  let offset=view.getUint32(end+16,true);const entries=view.getUint16(end+10,true),decoder=new TextDecoder();
  for(let index=0;index<entries;index++){
    if(view.getUint32(offset,true)!==0x02014b50)break;
    const method=view.getUint16(offset+10,true),size=view.getUint32(offset+20,true),nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true),localOffset=view.getUint32(offset+42,true),name=decoder.decode(new Uint8Array(buffer,offset+46,nameLength));
    if(name.toLowerCase().endsWith('.json')){const localName=view.getUint16(localOffset+26,true),localExtra=view.getUint16(localOffset+28,true),start=localOffset+30+localName+localExtra,raw=await inflateZipEntry(new Uint8Array(buffer,start,size),method);return parseWordBookJson(decoder.decode(raw))}
    offset+=46+nameLength+extraLength+commentLength;
  }
  throw new Error('压缩包中没有找到 JSON 词书。');
}
function parseWordBookJson(text){try{return JSON.parse(text)}catch(firstError){const rows=text.split(/\r?\n/).map(row=>row.trim()).filter(Boolean),records=[];for(const row of rows){try{records.push(JSON.parse(row.replace(/,$/,'')))}catch{}}if(records.length)return records;throw firstError}}
function collectWordBookEntries(data,bookId){
  const result=new Map(),stack=[data];
  while(stack.length){const value=stack.pop();if(!value||typeof value!=='object')continue;if(typeof value.headWord==='string'){
    const w=value.headWord.trim().toLowerCase();if(!/^[a-z][a-z '-]{0,44}$/.test(w))continue;
    const content=value.content?.word?.content||value.content?.content||{},translations=Array.isArray(content.trans)?content.trans:[],sentences=content.sentence?.sentences||[],first=sentences[0]||{};
    const zh=translations.map(item=>`${item.pos?item.pos+'. ':''}${item.tranCn||''}`.trim()).filter(Boolean).join('；')||'暂无中文释义';
    const def=translations.map(item=>item.tranOther||'').filter(Boolean).join('; '),ipa=content.usphone||content.ukphone||'',ex=first.sContent||'',exzh=first.sCn||'';
    result.set(w,[w,ipa,zh,def,ex,exzh,bookId]);continue
  }if(Array.isArray(value))for(const item of value)stack.push(item);else for(const item of Object.values(value))if(item&&typeof item==='object')stack.push(item)}return result;
}
async function importWordBook(id){
  const book=WORD_BOOKS.find(item=>item.id===id);if(!book)return;wordBookLoading=id;render();
  try{const response=await fetch(`/api/wordbooks/${encodeURIComponent(id)}`);if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'词书下载失败。')}const sourceEntries=collectWordBookEntries(await readZipJson(await response.arrayBuffer()),id),words=[...sourceEntries.keys()];if(!words.length)throw new Error('没有从词书中识别到单词。');const existing=new Set(WORDS.map(item=>item.w)),entries=[...sourceEntries.values()].filter(entry=>!existing.has(entry[0]));addImportedEntries(entries);importedWordBooks[id]={words,entries,sourceCount:words.length,importedAt:new Date().toISOString()};try{localStorage.setItem(wordBookStoreKey,JSON.stringify(importedWordBooks))}catch{toast('词书已导入；浏览器空间不足，下次打开可能需要重新导入。')}selectedWordBook=id;localStorage.setItem('englishLabSelectedWordbook',id);toast(`已导入《${book.title}》：${words.length} 个单词`)}catch(error){selectedWordBook='all';localStorage.setItem('englishLabSelectedWordbook','all');toast(error.message||'词书导入失败，请稍后再试。')}finally{wordBookLoading='';wordIndex=0;render()}
}
function wordBookOptions(){const groups=[...new Set(WORD_BOOKS.map(item=>item.group))];return `<option value="all">全部站内词汇</option>${groups.map(group=>`<optgroup label="${esc(group)}">${WORD_BOOKS.filter(item=>item.group===group).map(item=>{const imported=importedWordBooks[item.id],label=`${item.title} · ${item.count} 词${imported?` · 已导入 ${imported.words.length}`:''}`;return `<option value="${item.id}" ${selectedWordBook===item.id?'selected':''}>${esc(label)}</option>`}).join('')}</optgroup>`).join('')}`}
const wordsPageBeforeWordBooks=wordsPage,filteredBeforeWordBooks=filteredVocabularyWords;
filteredVocabularyWords=function(){const words=filteredBeforeWordBooks();if(selectedWordBook==='all')return words;const selected=wordBookSet(selectedWordBook);return words.filter(item=>selected.has(item.w))};
wordsPage=function(){const html=wordsPageBeforeWordBooks(),book=WORD_BOOKS.find(item=>item.id===selectedWordBook),record=importedWordBooks[selectedWordBook],panel=`<div class="wordbook-picker"><div><label for="wordbook-select">${vocabText('选择词书','Choose a word book')}</label><select id="wordbook-select" class="input" ${wordBookLoading?'disabled':''}>${wordBookOptions()}</select></div><p>${wordBookLoading?vocabText('正在下载并识别词书，请稍候……','Downloading and reading the word book…'):book&&record?vocabText(`当前按《${book.title}》学习，共 ${record.words.length} 个词；未收录于 ECDICT 的词也可以直接学习。`,`Studying ${book.title}: ${record.words.length} words, including words outside ECDICT.`):vocabText('选择后按需导入词书自带的音标、释义和例句；ECDICT 仅作为补充。','Import the book pronunciation, meanings and examples on demand; ECDICT is optional enrichment.')}</p></div>`;return html.replace('<section class="card vocab-filters">',`<section class="card vocab-filters">${panel}`)};
const adaptivePoolBeforeWordBooks=adaptiveGamePool;
adaptiveGamePool=function(){const pool=adaptivePoolBeforeWordBooks();if(selectedWordBook==='all')return pool;const selected=wordBookSet(selectedWordBook);return pool.filter(item=>selected.has(item.w))};
document.addEventListener('change',event=>{if(event.target.id!=='wordbook-select')return;const id=event.target.value;if(id==='all'){selectedWordBook='all';localStorage.setItem('englishLabSelectedWordbook','all');wordIndex=0;render();return}if(importedWordBooks[id]?.entries){selectedWordBook=id;localStorage.setItem('englishLabSelectedWordbook',id);wordIndex=0;render();return}importWordBook(id)},true);
