// DeepSeek 密钥只提交给同源服务端，并保存在加密的 HttpOnly 会话 Cookie 中。
NAV.push(['ai','✧','AI Tutor']);
uiTranslations.set('AI Tutor','AI 助教');
let aiConfigured=false;
let aiChecking=true;
let aiShowKeyForm=false;
let aiBusy=false;
let aiNotice='';
let aiModel='deepseek-flash';
let aiMessages=[];
const aiLabel=(zh,en)=>uiLanguage==='zh'?zh:en;
function aiPage(){
  const keyArea=!aiConfigured||aiShowKeyForm?`<div class="ai-setup"><label for="deepseek-key" style="display:block;font-size:14px;font-weight:750;margin:18px 0 7px">DeepSeek API Key</label><div class="search-row"><input id="deepseek-key" class="input" type="password" autocomplete="off" spellcheck="false" placeholder="sk-••••••••••••" aria-label="DeepSeek API Key"><button id="ai-save-key" class="primary">${aiLabel('验证并连接','Verify and connect')}</button></div><p class="muted-text">${aiLabel('Key 经加密后保存在当前浏览器会话中。关闭浏览器后需重新输入。请勿在聊天中发送密钥。','Your key is encrypted for this browser session. Enter it again after closing the browser. Do not paste it into chat.')}</p></div>`:'';
  const status=aiChecking?aiLabel('正在检查连接状态……','Checking connection…'):aiConfigured?aiLabel('DeepSeek 已连接，可以开始提问。','DeepSeek is connected. You can start asking questions.'):aiLabel('尚未连接。请在下方输入你的 DeepSeek API Key。','Not connected. Enter your DeepSeek API Key below.');
  return `<div class="content">${head(aiLabel('AI 英语老师','AI TUTOR'),aiLabel('AI 英语助教','AI English Tutor'),aiLabel('用简单英文解释单词、分析句子，也能把已学单词编成小故事。','Explain words, analyze sentences, and make stories using words you have learned.'))}
  <div class="two-col"><section class="card"><div class="ai-status ${aiConfigured?'ready':''}">${status}</div>${aiNotice?`<p class="notice" role="status">${esc(aiNotice)}</p>`:''}${keyArea}
  ${aiConfigured?`<div class="action-row" style="align-items:center;margin-top:18px"><label for="ai-model" style="font-size:13px;font-weight:700">${aiLabel('模型','Model')}</label><select id="ai-model" class="input" style="max-width:240px"><option value="deepseek-flash" ${aiModel==='deepseek-flash'?'selected':''}>DeepSeek Flash</option><option value="deepseek-v4-pro" ${aiModel==='deepseek-v4-pro'?'selected':''}>DeepSeek V4 Pro</option></select><button class="secondary" id="ai-change-key">${aiLabel('更换 Key','Change key')}</button><button class="secondary" id="ai-remove-key">${aiLabel('断开连接','Disconnect')}</button></div>
  <div class="ai-chat" id="ai-chat" aria-live="polite">${aiMessages.length?aiMessages.map(message=>`<div class="ai-message ${message.role}">${esc(message.content)}</div>`).join(''):`<p class="muted-text">${aiLabel('试着问：“请用简单英文解释 bug，再给我一个软件测试例句。”','Try: Explain bug in simple English and give me a software testing example.')}</p>`}</div><div class="ai-compose"><textarea id="ai-input" class="input" placeholder="${aiLabel('输入你想学的单词、句子或问题……','Enter a word, sentence, or question…')}"></textarea><button id="ai-send" class="primary" ${aiBusy?'disabled':''}>${aiBusy?aiLabel('生成中…','Generating…'):aiLabel('发送','Send')}</button></div><div class="category-row" style="margin-top:16px"><button class="chip" data-ai-prompt="explain">${aiLabel('解释一个单词','Explain a word')}</button><button class="chip" data-ai-prompt="story">${aiLabel('用已学单词写故事','Write a story')}</button><button class="chip" data-ai-prompt="quiz">${aiLabel('出一道小测验','Make a quiz')}</button></div>`:''}</section>
  <aside class="card"><div class="eyebrow">${aiLabel('使用说明','ABOUT THIS CONNECTION')}</div><p class="muted-text">${aiLabel('密钥只用于本网站服务端向 DeepSeek 发起请求。网页不会保存或回显明文密钥；聊天内容会发送给 DeepSeek 以生成回答。','Your key is used only by the site server to call DeepSeek. The page does not store or display the plaintext key. Chat content is sent to DeepSeek to generate replies.')}</p><p class="muted-text">${aiLabel('模型调用可能产生费用，具体以你的 DeepSeek 账户为准。','Model usage may incur charges according to your DeepSeek account.')}</p><p class="muted-text"><a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">${aiLabel('打开 DeepSeek 密钥管理页 ↗','Open DeepSeek API keys ↗')}</a></p></aside></div></div>`;
}
const previousRender=render;
render=function(){previousRender();if(page==='ai'){$('#app').innerHTML=aiPage();localizePage()}};
async function aiRequest(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({error:aiLabel('服务暂时不可用。','Service unavailable.')}));
  if(!response.ok)throw new Error(data.error||aiLabel('请求失败。','Request failed.'));
  return data;
}
async function checkAiStatus(){
  aiChecking=true;render();
  try{const data=await aiRequest('/api/deepseek/status');aiConfigured=Boolean(data.configured);aiNotice=''}
  catch(error){aiNotice=error.message}
  aiChecking=false;render();
}
async function saveAiKey(){
  const input=$('#deepseek-key');const key=input?.value.trim();
  if(!key){aiNotice=aiLabel('请先输入 API Key。','Enter your API key first.');render();return}
  input.value='';aiBusy=true;aiNotice=aiLabel('正在验证 Key……','Verifying key…');render();
  try{
    await aiRequest('/api/deepseek/key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
    aiConfigured=true;aiShowKeyForm=false;aiNotice=aiLabel('连接成功。现在可以开始提问。','Connected. You can start asking questions.');
  }catch(error){aiNotice=error.message;aiShowKeyForm=true}
  aiBusy=false;render();
}
async function removeAiKey(){
  try{await aiRequest('/api/deepseek/key',{method:'DELETE',headers:{'Content-Type':'application/json'},body:'{}'});aiConfigured=false;aiMessages=[];aiShowKeyForm=false;aiNotice=aiLabel('已断开连接。','Disconnected.')}catch(error){aiNotice=error.message}render();
}
async function sendAiMessage(){
  const input=$('#ai-input'),content=input?.value.trim();if(!content||aiBusy||!aiConfigured)return;
  input.value='';aiMessages.push({role:'user',content});aiBusy=true;aiNotice='';render();
  try{
    const data=await aiRequest('/api/deepseek/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:aiModel,messages:aiMessages.slice(-10)})});
    aiMessages.push({role:'assistant',content:data.reply||aiLabel('模型没有返回内容。','The model returned no content.')});
  }catch(error){aiMessages.push({role:'assistant',content:aiLabel('暂时无法回答：','Could not answer: ')+error.message})}
  aiBusy=false;render();$('#ai-chat')?.scrollTo(0,$('#ai-chat').scrollHeight);
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='ai-save-key')return saveAiKey();
  if(button.id==='ai-change-key'){aiShowKeyForm=!aiShowKeyForm;render();return}
  if(button.id==='ai-remove-key')return removeAiKey();
  if(button.id==='ai-send')return sendAiMessage();
  if(button.dataset.aiPrompt){
    const prompts={explain:aiLabel('请用 A1 级简单英文解释 bug，给一个软件测试例句，最后给一句中文提示。','Explain bug in A1 English, give a testing example, then one Chinese hint.'),story:aiLabel(`请用这些单词写一篇 A1 级英文小故事：${(state.learned.length?state.learned:['bug','test case','prompt']).slice(0,8).join(', ')}。附简短中文解释。`,`Write an A1 English story using these words: ${(state.learned.length?state.learned:['bug','test case','prompt']).slice(0,8).join(', ')}. Add short Chinese help.`),quiz:aiLabel('请出一道 A1 级软件测试英语选择题。先不要告诉我答案。','Make one A1 software testing English quiz question. Do not give the answer yet.')};
    const input=$('#ai-input');if(input)input.value=prompts[button.dataset.aiPrompt];
  }
});
document.addEventListener('change',event=>{if(event.target.id==='ai-model')aiModel=event.target.value});
render();checkAiStatus();
