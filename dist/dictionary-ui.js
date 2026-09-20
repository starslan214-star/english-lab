// 词典页将开放词库、英英释义与用户自己的百度翻译连接显示在同一页。
let baiduReady=null,dictSerial=0;
const dictText=(zh,en)=>uiLanguage==='zh'?zh:en;
const dictEnglish=text=>/^[a-z][a-z -]{0,44}$/i.test(text);
const dictChinese=text=>/[\u3400-\u9fff]/.test(text);
const dictLocal=name=>{
  const term=name.toLowerCase();
  if(dictEnglish(name)){
    const exact=WORDS.filter(item=>item.w===term);
    return exact.length?exact.slice(0,1):WORDS.filter(item=>item.w.startsWith(term)).slice(0,8);
  }
  if(dictChinese(name))return WORDS.filter(item=>item.zh.includes(name)).slice(0,12);
  return [];
};
const dictLocalCard=item=>{
  const pieces=item.zh.split(/\n|(?=\b(?:n|v|vt|vi|adj|adv|a|prep|pron|conj|int)\.)/i).map(part=>part.trim()).filter(Boolean);
  return `<article class="dict-entry"><div class="dict-entry-top"><div><h3>${esc(item.w)}</h3><p class="phonetic">${esc(item.ipa||'')}</p></div><button class="secondary" data-speak="${esc(item.w)}">${dictText('🔊 发音','🔊 Listen')}</button></div><div class="dict-field"><b>${dictText('词性与汉语意思','Part of speech & Chinese meaning')}</b>${pieces.map(part=>`<p>${esc(part)}</p>`).join('')}</div>${item.def?`<div class="dict-field"><b>${dictText('英英解释','English definition')}</b><p>${esc(item.def)}</p></div>`:''}${item.ex?`<div class="dict-field"><b>${dictText('例句','Example')}</b><p>${esc(item.ex)}</p></div>`:''}<small>${item.levels?.join(' · ')||dictText('情景词','Situation word')} · ECDICT</small>${word(item.w)?`<button class="dict-study" data-learn-word="${esc(item.w)}">${dictText('加入学习','Add to words')}</button>`:''}</article>`;
};
dictionaryPage=function(){
  const term=query.trim(),matches=term?dictLocal(term):[];
  return `<div class="content dict-page">${head(dictText('站内词典','DICTIONARY'),dictText('查词与翻译','Dictionary & translation'),dictText('可查英文、中文词语和短句；释义与译文按来源分别显示。','Look up English, Chinese terms and short sentences. Results show their sources.'))}<section class="card dict-search"><div class="search-row"><input id="lookup-input" class="input" type="search" value="${esc(query)}" maxlength="900" placeholder="${dictText('输入英文或中文，例如 ability、能力','Enter English or Chinese, e.g. ability')}" aria-label="${dictText('查词或翻译','Dictionary search')}"><button class="primary" id="lookup-search">${dictText('查询','Search')}</button></div><p>${dictText('无需限定在背词表内。短句翻译需要先连接百度翻译。','Search beyond your study list. Connect Baidu for sentence translation.')}</p></section>${term?`<div class="dict-query-title"><h2>${esc(term)}</h2><span>${dictChinese(term)?dictText('汉英查询','Chinese → English'):dictText('英汉 / 英英查询','English → Chinese / English')}</span></div><section class="dict-results"><div class="card"><div class="mini-title"><h3>${dictText('词性与汉语意思','Part of speech & Chinese meaning')}</h3><span>ECDICT</span></div>${matches.length?matches.map(dictLocalCard).join(''):`<p class="muted-text">${dictText('开放词库暂无精确词条。连接百度翻译后仍可查询译文。','No exact local entry. Baidu can still translate it when connected.')}</p>`}</div><div class="card"><div class="mini-title"><h3>${dictText('英英解释与例句','English definitions & examples')}</h3><span>Free Dictionary API</span></div><div id="dict-english" aria-live="polite">${dictEnglish(term)?dictText('正在读取……','Loading…'):dictText('输入英文词条后显示。','Enter an English word to see definitions.')}</div></div><div class="card"><div class="mini-title"><h3>${dictText('百度翻译','Baidu Translate')}</h3><span>${dictText('英汉 / 汉英','EN ↔ ZH')}</span></div><div id="dict-baidu" aria-live="polite">${dictText('正在检查连接……','Checking connection…')}</div></div><div class="card dict-empty-fields"><h3>${dictText('固定搭配与用法','Collocations & usage')}</h3><p>${dictText('当前开放数据没有可靠的固定搭配和专门用法说明；有来源数据时才会在这里显示，避免编造。','The current open sources do not provide reliable collocations or usage notes. They will appear here when available.')}</p></div></section>`:''}<section class="card dict-settings"><div class="mini-title"><h3>${dictText('连接百度翻译','Connect Baidu Translate')}</h3><span id="dict-baidu-status">${dictText('检查中','Checking')}</span></div><p>${dictText('填写「通用文本翻译」的 APP ID 和密钥。验证后即可在本页查询任意中英文词语或短句。','Enter the APP ID and secret key for General Text Translation. After verification, use them here for words and short sentences.')}</p><div id="dict-baidu-form" class="dict-credentials"><label>${dictText('APP ID','APP ID')}<input id="dict-appid" class="input" autocomplete="off" spellcheck="false"></label><label>${dictText('密钥','Secret key')}<input id="dict-secret" class="input" type="password" autocomplete="off" spellcheck="false"></label><div class="action-row"><button id="dict-connect" class="primary">${dictText('验证并连接','Verify & connect')}</button><button id="dict-disconnect" class="secondary" hidden>${dictText('断开连接','Disconnect')}</button></div></div><p id="dict-config-message" class="muted-text" role="status">${dictText('密钥由本站服务端加密保存在当前浏览器的安全 Cookie 中，页面不会显示已保存的密钥。查询文本会发送给百度翻译。','The key is encrypted in a secure cookie for this browser and never displayed. Queries are sent to Baidu.')}</p></section><section class="card dict-providers"><h3>${dictText('其他词典来源','Other dictionary sources')}</h3><div><b>网易有道词典</b><span>${dictText('正式词典接口需要另行开通；接入后可在本页显示词典结果。','Its licensed dictionary API requires separate access.')}</span></div><div><b>欧路词典</b><span>${dictText('目前开放接口主要用于个人生词本，不提供可嵌入的完整释义。','Its public API centers on personal wordbooks rather than full definitions.')}</span></div></section><p class="footer-note">${dictText('本页会标明每项结果来源；百度翻译提供译文，开放英英词典提供词性、释义与例句。','Results show their sources. Baidu provides translations; the open English dictionary provides meanings and examples.')}</p></div>`;
};

function dictShowStatus(){
  const status=document.getElementById('dict-baidu-status');if(!status)return;
  status.textContent=baiduReady===null?dictText('检查中','Checking'):baiduReady?dictText('已连接','Connected'):dictText('未连接','Not connected');
  document.getElementById('dict-disconnect').hidden=!baiduReady;
  document.getElementById('dict-baidu-form').classList.toggle('connected',Boolean(baiduReady));
}
async function dictGetStatus(){
  try{const response=await fetch('/api/baidu/status');baiduReady=Boolean((await response.json()).configured)}catch{baiduReady=false}
  if(page==='dictionary')dictShowStatus();
}
async function dictLoad(){
  const term=query.trim(),serial=++dictSerial;if(!term||page!=='dictionary')return;
  if(baiduReady===null)void dictGetStatus();
  dictShowStatus();
  const english=document.getElementById('dict-english');
  if(english&&dictEnglish(term))void (async()=>{
    try{const response=await fetch('/api/dictionary/'+encodeURIComponent(term.toLowerCase()));const data=await response.json();if(serial!==dictSerial||page!=='dictionary')return;
      english.innerHTML=response.ok?`<div class="dict-meanings">${(data.meanings||[]).map(item=>`<div><b>${esc(item.partOfSpeech||dictText('释义','Meaning'))}</b><p>${esc(item.definition)}</p>${item.example?`<p class="dict-example">${dictText('例句：','Example: ')}${esc(item.example)}</p>`:''}${item.synonyms?.length?`<p class="dict-related">${dictText('同义词：','Synonyms: ')}${esc(item.synonyms.join(' · '))}</p>`:''}</div>`).join('')}</div>`:`<p class="muted-text">${dictText('暂未找到开放英英释义。','No open English definition found.')}</p>`;
    }catch{if(serial===dictSerial&&english)english.textContent=dictText('英英词典暂时无法连接。','English dictionary is temporarily unavailable.')}
  })();
  const baidu=document.getElementById('dict-baidu');if(!baidu)return;
  if(baiduReady===null){baidu.textContent=dictText('百度翻译为可选功能；开放词典结果正在上方读取。','Baidu Translate is optional; open-dictionary results are loading above.');return}
  if(!baiduReady){baidu.textContent=dictText('开放词典无需配置即可使用；如需整句中英翻译，可在下方连接百度翻译。','The open dictionaries work without setup. Connect Baidu below only for sentence translation.');return}
  baidu.textContent=dictText('正在翻译……','Translating…');
  try{const response=await fetch('/api/baidu/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:term,from:dictChinese(term)?'zh':'en',to:dictChinese(term)?'en':'zh'})});const data=await response.json();if(serial!==dictSerial||page!=='dictionary')return;
    baidu.innerHTML=response.ok?data.results.map(item=>`<div class="dict-translation"><span>${esc(item.source)}</span><strong>${esc(item.target)}</strong></div>`).join(''):`<p class="muted-text">${esc(data.error||dictText('翻译失败，请稍后重试。','Translation failed. Try again later.'))}</p>`;
  }catch{if(serial===dictSerial&&baidu)baidu.textContent=dictText('百度翻译暂时无法连接。','Baidu Translate is temporarily unavailable.')}
}
const renderBeforeDictionary=render;
render=function(){renderBeforeDictionary();if(page==='dictionary'){dictShowStatus();if(query.trim())dictLoad();else if(baiduReady===null)dictGetStatus()}};
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(page!=='dictionary'||!button||!['dict-connect','dict-disconnect'].includes(button.id))return;
  event.preventDefault();event.stopImmediatePropagation();button.disabled=true;
  const message=document.getElementById('dict-config-message');
  if(button.id==='dict-connect'){
    const appid=document.getElementById('dict-appid').value.trim(),key=document.getElementById('dict-secret').value.trim();
    if(!appid||!key){message.textContent=dictText('请填写 APP ID 和密钥。','Enter both APP ID and secret key.');button.disabled=false;return}
    message.textContent=dictText('正在验证……','Verifying…');
    try{const response=await fetch('/api/baidu/key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({appid,key})});const data=await response.json();if(!response.ok)throw new Error(data.error||'验证失败');baiduReady=true;document.getElementById('dict-appid').value='';document.getElementById('dict-secret').value='';message.textContent=dictText('已连接。现在可以在上方查询。','Connected. You can search above now.');dictShowStatus();if(query.trim())dictLoad()}
    catch(error){message.textContent=error.message}
  }else{
    try{await fetch('/api/baidu/key',{method:'DELETE',headers:{'Content-Type':'application/json'},body:'{}'});baiduReady=false;message.textContent=dictText('已断开百度翻译。','Baidu Translate disconnected.');dictShowStatus();const result=document.getElementById('dict-baidu');if(result)result.textContent=dictText('连接后即可查询译文。','Connect to see translations.')}
    catch{message.textContent=dictText('断开失败，请重试。','Could not disconnect. Try again.')}
  }
  button.disabled=false;
},true);
document.addEventListener('click',clickEvent=>{
  const name=clickEvent.target.closest('[data-learn-word]')?.dataset.learnWord;
  if(page!=='dictionary'||!name)return;
  clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
  if(!state.learned.includes(name)){state.learned.push(name);state.reviews[name] ||= initialReview();event('learn',name);state.xp+=5;save();toast(dictText('已加入学习词汇','Added to your study words'))}
  else toast(dictText('这个词已在学习记录中','This word is already in your study list'));
},true);
