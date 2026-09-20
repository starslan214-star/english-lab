// 将 Datamuse（Wiktionary + WordNet）结果直接显示在站内词典，不打开外部标签页。
let datamuseSerial=0;
const datamuseText=(zh,en)=>uiLanguage==='zh'?zh:en;

function datamuseCard(){
  return `<div class="card dict-datamuse"><div class="mini-title"><h3>${datamuseText('开放词典补充','Open dictionary supplement')}</h3><span>Datamuse · Wiktionary + WordNet</span></div><div id="dict-datamuse" aria-live="polite">${datamuseText('正在读取……','Loading…')}</div></div>`;
}

async function loadDatamuse(){
  const term=query.trim(),target=document.getElementById('dict-datamuse'),serial=++datamuseSerial;
  if(!target||!dictEnglish(term))return;
  try{
    const response=await fetch('/api/datamuse/'+encodeURIComponent(term.toLowerCase())),data=await response.json();
    if(serial!==datamuseSerial||page!=='dictionary'||!target.isConnected)return;
    if(!response.ok){target.innerHTML=`<p class="muted-text">${datamuseText('该开放来源暂未找到此词。','No entry found in this open source.')}</p>`;return}
    target.innerHTML=`${data.pronunciation?`<p class="phonetic">/${esc(data.pronunciation)}/</p>`:''}<div class="dict-meanings">${data.definitions.map(item=>`<div><b>${esc(item.partOfSpeech||datamuseText('释义','Meaning'))}</b><p>${esc(item.definition)}</p></div>`).join('')}</div>${data.related?.length?`<p class="dict-related"><b>${datamuseText('相关词：','Related words: ')}</b>${esc(data.related.join(' · '))}</p>`:''}<small class="dict-source-note">${datamuseText('定义来源：Wiktionary 与 WordNet；由 Datamuse API 提供。','Definitions from Wiktionary and WordNet via the Datamuse API.')}</small>`;
  }catch{if(serial===datamuseSerial&&target.isConnected)target.textContent=datamuseText('开放词典暂时无法连接。','The open dictionary is temporarily unavailable.')}
}

const renderBeforeDatamuse=render;
render=function(){
  renderBeforeDatamuse();
  if(page!=='dictionary'||!query.trim())return;
  const results=document.querySelector('.dict-results');
  if(results&&dictEnglish(query.trim())){results.insertAdjacentHTML('beforeend',datamuseCard());loadDatamuse()}
  const providers=document.querySelector('.dict-providers');
  if(providers)providers.innerHTML=`<h3>${datamuseText('已接入的站内词典','Integrated dictionaries')}</h3><div><b>ECDICT</b><span>${datamuseText('本地英汉释义、音标与考试标签。','Local English-Chinese meanings, phonetics, and exam tags.')}</span></div><div><b>Free Dictionary</b><span>${datamuseText('英英释义、例句与同义词。','English definitions, examples, and synonyms.')}</span></div><div><b>Datamuse</b><span>${datamuseText('整合 Wiktionary 与 WordNet 定义及相关词。','Wiktionary and WordNet definitions plus related words.')}</span></div>`;
};

render();
