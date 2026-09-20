// AI 词典补充按用户操作调用，避免每次查词都产生模型费用。
const renderBeforeAiDictionary=render;
render=function(){
  renderBeforeAiDictionary();
  if(page!=='dictionary'||!query.trim())return;
  const results=document.querySelector('.dict-results');
  if(!results)return;
  results.insertAdjacentHTML('beforeend',`<section class="card dict-ai-card"><div class="mini-title"><h3>${dictText('AI 助教补充','AI tutor notes')}</h3><span>DeepSeek AI</span></div><p class="muted-text">${dictText('可补充词性、搭配、用法和例句。内容由 AI 生成，请与可靠词典交叉核对；仅点击时调用你的模型。','Get parts of speech, collocations, usage and examples. AI content should be checked against a dictionary. Your model is called only when you click.')}</p><button class="secondary" id="dict-ai-generate">${dictText('生成学习解释','Generate study notes')}</button><div id="dict-ai-result" class="dict-ai-result" aria-live="polite"></div></section>`);
};
document.addEventListener('click',async clickEvent=>{
  const button=clickEvent.target.closest('#dict-ai-generate');
  if(!button||page!=='dictionary')return;
  clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
  button.disabled=true;
  const term=query.trim(),target=document.getElementById('dict-ai-result');
  target.textContent=dictText('正在生成……','Generating…');
  try{
    const response=await fetch('/api/deepseek/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({term})});
    const data=await response.json();
    if(page!=='dictionary'||query.trim()!==term||!target.isConnected)return;
    if(!response.ok)throw new Error(data.error||dictText('暂时无法生成。','Could not generate.'));
    target.innerHTML=`<div>${esc(data.reply)}</div><small>DeepSeek AI · ${dictText('生成内容，可能有误','Generated content; check accuracy')}</small>`;
  }catch(error){if(target.isConnected)target.textContent=error.message}
  finally{if(button.isConnected)button.disabled=false}
},true);
