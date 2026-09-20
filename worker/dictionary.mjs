// 按需读取开放英英词典；不向第三方发送学习记录或密钥。
const dictionaryCache=new Map();
const datamuseCache=new Map();
export async function getDictionaryDefinition(name){
  if(!/^[a-z][a-z -]{0,44}$/.test(name))return null;
  const key=name.toLowerCase();
  const cached=dictionaryCache.get(key);
  if(cached&&Date.now()-cached.at<86400000)return cached.value;
  const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,{signal:AbortSignal.timeout(7000)});
  if(!response.ok)return null;
  const entries=await response.json();
  const entry=Array.isArray(entries)?entries[0]:null;
  const meanings=Array.isArray(entry?.meanings)?entry.meanings:[];
  const definitions=meanings.flatMap(item=>(Array.isArray(item.definitions)?item.definitions:[]).filter(def=>typeof def.definition==='string').slice(0,3).map(def=>({partOfSpeech:item.partOfSpeech||'',definition:def.definition.slice(0,500),example:typeof def.example==='string'?def.example.slice(0,350):'',synonyms:Array.isArray(def.synonyms)?def.synonyms.slice(0,5):[]}))).slice(0,12);
  const first=definitions[0];
  if(!first)return null;
  const value={word:key,phonetic:entry?.phonetic||'',definition:first.definition,example:first.example,meanings:definitions,source:'Free Dictionary API'};
  if(dictionaryCache.size>=200)dictionaryCache.delete(dictionaryCache.keys().next().value);
  dictionaryCache.set(key,{at:Date.now(),value});
  return value;
}

// Datamuse 的定义元数据来自 Wiktionary 与 WordNet，相关词用于补充同义词和联想记忆。
export async function getDatamuseDefinition(name){
  if(!/^[a-z][a-z -]{0,44}$/.test(name))return null;
  const key=name.toLowerCase(),cached=datamuseCache.get(key);
  if(cached&&Date.now()-cached.at<86400000)return cached.value;
  const timeout=AbortSignal.timeout(7000);
  const [entryResponse,relatedResponse]=await Promise.all([
    fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(key)}&qe=sp&md=dpr&max=10`,{signal:timeout}),
    fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(key)}&max=12`,{signal:timeout})
  ]);
  if(!entryResponse.ok)return null;
  const entries=await entryResponse.json(),entry=Array.isArray(entries)?entries.find(item=>item.word?.toLowerCase()===key&&Array.isArray(item.defs)):null;
  const related=relatedResponse.ok?await relatedResponse.json():[];
  if(!entry)return null;
  const definitions=entry.defs.slice(0,10).map(text=>{const [partOfSpeech,...rest]=text.split('\t');return {partOfSpeech,definition:rest.join('\t').slice(0,500)}}).filter(item=>item.definition);
  if(!definitions.length)return null;
  const value={word:key,definitions,pronunciation:entry.tags?.find(tag=>tag.startsWith('pron:'))?.slice(5)||'',related:Array.isArray(related)?related.map(item=>item.word).filter(Boolean).slice(0,12):[],source:'Datamuse · Wiktionary + WordNet'};
  if(datamuseCache.size>=200)datamuseCache.delete(datamuseCache.keys().next().value);
  datamuseCache.set(key,{at:Date.now(),value});
  return value;
}
