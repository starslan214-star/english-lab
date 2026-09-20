// 精简词典结果：保留 ECDICT、Datamuse 英英解释、百度翻译和按需 AI，不显示重复空板块。
const renderBeforeDictionaryLayout=render;
render=function(){
  renderBeforeDictionaryLayout();if(page!=='dictionary'||!query.trim())return;
  document.getElementById('dict-english')?.closest('.card')?.remove();
  document.querySelector('.dict-empty-fields')?.remove();
  const datamuse=document.querySelector('.dict-datamuse');
  if(datamuse){const title=datamuse.querySelector('h3');if(title)title.textContent=uiLanguage==='zh'?'英英解释与例句':'English definitions & examples';const first=document.querySelector('.dict-results>.card');if(first&&datamuse.previousElementSibling!==first)first.insertAdjacentElement('afterend',datamuse)}
  const providers=document.querySelector('.dict-providers');if(providers)providers.innerHTML=`<h3>${uiLanguage==='zh'?'已接入的站内词典':'Integrated dictionaries'}</h3><div><b>ECDICT</b><span>${uiLanguage==='zh'?'本地英汉释义、音标与考试标签。':'Local English-Chinese meanings, phonetics, and exam tags.'}</span></div><div><b>Datamuse</b><span>${uiLanguage==='zh'?'Wiktionary 与 WordNet 英英释义和相关词。':'English definitions and related words from Wiktionary and WordNet.'}</span></div>`;
};
render();
