// 设置页提供当前浏览器的连接状态、每日任务量和学习记录备份。
NAV.push(['settings','⚙','Settings']);
uiTranslations.set('Settings','设置');
const settingsText=(zh,en)=>uiLanguage==='zh'?zh:en;
function settingsPage(){
  const reviewCount=Object.keys(state.reviews).length;
  return `<div class="content settings-page">${head(settingsText('学习工作台','WORKSPACE'),settingsText('设置与备份','Settings & backup'),settingsText('检查连接，并保存当前浏览器中的学习记录。','Check connections and back up your learning data.'))}<div class="two-col"><section class="card"><h2>${settingsText('学习数据','Learning data')}</h2><p class="muted-text">${settingsText('已学单词','Learned words')}：${state.learned.length} · ${settingsText('复习记录','Review records')}：${reviewCount} · ${settingsText('学习笔记','Notebook entries')}：${state.notebook?.length||0}</p><div class="settings-actions"><button class="primary" id="settings-export">${settingsText('下载完整备份','Download full backup')}</button><label class="settings-import">${settingsText('合并导入备份','Merge a backup')}<input id="settings-import-file" type="file" accept=".json,application/json" aria-label="${settingsText('选择学习数据备份文件','Choose learning backup file')}"></label></div><p id="settings-message" class="muted-text" role="status">${settingsText('备份包括单词、复习、阅读、游戏和笔记；不包含 AI 或词典密钥。导入会合并记录，不会清空当前数据。','The backup includes words, reviews, reading, games and notes. It excludes API keys. Import merges with current data.')}</p></section><section class="card"><h2>${settingsText('每日任务量','Daily quests')}</h2><p class="muted-text">${settingsText('设置 Today 页每天的目标数量，建议保持在 30-45 分钟内能完成。','Set the daily targets shown on the Today page. Keep them finishable in 30-45 minutes.')}</p><div class="settings-status"><span>${settingsText('每天复习','Daily reviews')}</span><input id="quest-review" class="input" type="number" min="1" max="50" value="${state.quests.review}" style="max-width:90px" aria-label="${settingsText('每天复习数量','Daily review target')}"></div><div class="settings-status"><span>${settingsText('每天新词','Daily new words')}</span><input id="quest-learn" class="input" type="number" min="1" max="50" value="${state.quests.learn}" style="max-width:90px" aria-label="${settingsText('每天新词数量','Daily new-word target')}"></div><p class="muted-text">${settingsText('修改后立即生效并自动保存。','Changes apply and save immediately.')}</p></section><section class="card"><h2>${settingsText('连接与语言','Connections & language')}</h2><div class="settings-status"><span>DeepSeek AI</span><b id="settings-ai-status">${settingsText('检查中','Checking')}</b><button class="secondary" data-nav="ai">${settingsText('打开 AI 助教','Open AI tutor')}</button></div><div class="settings-status"><span>${settingsText('百度翻译','Baidu Translate')}</span><b id="settings-baidu-status">${settingsText('检查中','Checking')}</b><button class="secondary" data-nav="dictionary">${settingsText('打开词典','Open dictionary')}</button></div><div class="settings-status"><span>${settingsText('界面语言','Interface language')}</span><b>${uiLanguage==='zh'?'简体中文':'English'}</b><button class="secondary" id="settings-language">${settingsText('切换为英文','Switch to Chinese')}</button></div></section></div><p class="footer-note">${settingsText('数据仍只保存在当前浏览器。备份文件请自行妥善保管；跨设备自动同步尚未开放。','Data remains in this browser. Keep backups safely. Automatic sync is not available yet.')}</p></div>`;
}
const renderBeforeSettings=render;
render=function(){
  renderBeforeSettings();
  if(page==='settings'){$('#app').innerHTML=settingsPage();localizePage();settingsCheckConnections()}
};
async function settingsCheckConnections(){
  const checks=[['/api/deepseek/status','settings-ai-status'],['/api/baidu/status','settings-baidu-status']];
  for(const [url,id] of checks){
    try{const response=await fetch(url,{cache:'no-store'});const data=await response.json();const target=document.getElementById(id);if(target)target.textContent=data.configured?settingsText('已连接','Connected'):settingsText('未连接','Not connected')}
    catch{const target=document.getElementById(id);if(target)target.textContent=settingsText('暂时无法检查','Unavailable')}
  }
}
function settingsBackup(){
  const backup={version:2,exportedAt:new Date().toISOString(),learned:state.learned,reviews:state.reviews,read:state.read,events:state.events,xp:state.xp,quests:state.quests,notebook:state.notebook||[]};
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'}));link.download=`English-Lab-Backup-${today()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
function settingsMergeBackup(input){
  if(!input||![1,2].includes(input.version)||!Array.isArray(input.learned)||!Array.isArray(input.read)||!Array.isArray(input.events)||!input.reviews||typeof input.reviews!=='object'||!Array.isArray(input.notebook))throw new Error(settingsText('文件格式不是 English Lab 备份。','This is not an English Lab backup.'));
  if(input.learned.length>30000||input.read.length>30000||input.events.length>50000||input.notebook.length>10000)throw new Error(settingsText('备份数据过大。','Backup is too large.'));
  const cleanNames=values=>values.filter(value=>typeof value==='string'&&value.length<=100);
  state.learned=[...new Set([...state.learned,...cleanNames(input.learned)])];
  state.read=[...new Set([...state.read,...cleanNames(input.read)])];
  for(const [name,record] of Object.entries(input.reviews)){
    if(['__proto__','prototype','constructor'].includes(name)||name.length>100||!record||typeof record!=='object'||!Number.isFinite(Number(record.due)))continue;
    // 复习记录统一交给 review-core 迁移：旧格式自动补齐 FSRS 字段，新格式原样保留。
    if(!state.reviews[name]||Number(record.updatedAt||0)>Number(state.reviews[name].updatedAt||0))state.reviews[name]=migrateReviewRecord(record);
  }
  if(input.version>=2&&input.quests&&typeof input.quests==='object'){state.quests={...state.quests,...input.quests}}
  const knownEvents=new Set(state.events.map(item=>JSON.stringify(item)));
  for(const item of input.events){if(!item||typeof item!=='object'||typeof item.date!=='string'||typeof item.type!=='string')continue;const key=JSON.stringify(item);if(key.length>2000||knownEvents.has(key))continue;state.events.push(item);knownEvents.add(key)}
  const noteIds=new Set((state.notebook||[]).map(item=>item.id));
  for(const item of input.notebook){if(!item||typeof item.id!=='string'||typeof item.term!=='string'||item.id.length>100||item.term.length>200||noteIds.has(item.id))continue;state.notebook.push({id:item.id,term:item.term,notes:typeof item.notes==='string'?item.notes.slice(0,8000):'',createdAt:typeof item.createdAt==='string'?item.createdAt.slice(0,20):today()});noteIds.add(item.id)}
  state.xp=Math.max(Number(state.xp)||0,Math.min(100000000,Number(input.xp)||0));
  save();
}
document.addEventListener('click',clickEvent=>{
  const button=clickEvent.target.closest('button');if(page!=='settings'||!button)return;
  if(button.id==='settings-export'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();settingsBackup()}
  if(button.id==='settings-language'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();document.getElementById('language-toggle')?.click()}
},true);
document.addEventListener('change',async changeEvent=>{
  if(changeEvent.target.id==='quest-review'||changeEvent.target.id==='quest-learn'){const key=changeEvent.target.id==='quest-review'?'review':'learn',value=Math.min(50,Math.max(1,Number(changeEvent.target.value)||0));state.quests[key]=value;changeEvent.target.value=value;save();return}
  if(page!=='settings'||changeEvent.target.id!=='settings-import-file')return;
  const file=changeEvent.target.files?.[0],message=document.getElementById('settings-message');if(!file)return;
  try{if(file.size>2_000_000)throw new Error(settingsText('请选择小于 2 MB 的备份文件。','Choose a backup smaller than 2 MB.'));settingsMergeBackup(JSON.parse(await file.text()));render();const current=document.getElementById('settings-message');if(current)current.textContent=settingsText('备份已合并；当前记录仍保留。','Backup merged. Current data was kept.')}
  catch(error){if(message)message.textContent=error.message}
},true);
render();
