// 按需读取开放英英词典；不向第三方发送学习记录或密钥。
const dictionaryCache=new Map();
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
