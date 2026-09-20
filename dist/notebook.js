// 学习笔记保存在当前浏览器，支持从词典收藏和导出 Markdown。
NAV.splice(5,0,['notebook','▣','Notebook']);
uiTranslations.set('Notebook','学习笔记');
state.notebook=Array.isArray(state.notebook)?state.notebook:[];
let notebookSelected=state.notebook[0]?.id||null;
const noteText=(zh,en)=>uiLanguage==='zh'?zh:en;
function notebookPage(){
  const items=state.notebook.slice().reverse();
  const selected=state.notebook.find(item=>item.id===notebookSelected)||items[0];
  return `<div class="content notebook-page">${head(noteText('我的学习档案','MY NOTEBOOK'),noteText('学习笔记','Notebook'),noteText('保存查过的词语和句子，写下自己的理解。笔记只保存在当前浏览器。','Save words and sentences with your own notes. Data stays in this browser.'),`<span class="pill">${items.length} ${noteText('条笔记','notes')}</span>`)}<div class="notebook-toolbar"><button class="secondary" id="note-export" ${items.length?'':'disabled'}>${noteText('导出 Markdown','Export Markdown')}</button></div><div class="two-col"><section class="card"><div class="mini-title"><h3>${noteText('已保存','Saved entries')}</h3><span>${items.length}</span></div>${items.length?`<div class="notebook-list">${items.map(item=>`<button class="${item.id===selected?.id?'selected':''}" data-note-open="${esc(item.id)}"><b>${esc(item.term)}</b><small>${esc(item.createdAt)}</small></button>`).join('')}</div>`:`<p class="muted-text">${noteText('笔记还是空的。到「词典」查词或句子后，点击「保存到笔记」。','No notes yet. Search in Dictionary, then choose “Save to notebook”.')}</p><button class="primary" data-nav="dictionary">${noteText('去词典','Open dictionary')}</button>`}</section><section class="card">${selected?`<div class="notebook-entry-head"><div><span class="eyebrow">${noteText('学习条目','STUDY ENTRY')}</span><h2>${esc(selected.term)}</h2><small>${esc(selected.createdAt)}</small></div><button class="secondary" data-note-lookup="${esc(selected.term)}">${noteText('重新查询','Look up again')}</button></div><label for="notebook-editor">${noteText('我的理解、例句或疑问','My notes, examples or questions')}</label><textarea id="notebook-editor" class="input" rows="11" maxlength="8000" placeholder="${noteText('用自己的话记下意思、用法或例句……','Write the meaning, usage or an example in your own words…')}">${esc(selected.notes||'')}</textarea><div class="action-row"><button class="primary" id="note-save" data-note-id="${esc(selected.id)}">${noteText('保存笔记','Save note')}</button><button class="secondary" id="note-delete" data-note-id="${esc(selected.id)}">${noteText('删除条目','Delete entry')}</button></div>`:`<p class="muted-text">${noteText('选择左侧条目开始记录。','Select an entry to write a note.')}</p>`}</section></div><p class="footer-note">${noteText('更换浏览器或清除网站数据会使本地笔记丢失；请定期导出备份。','Changing browsers or clearing site data removes local notes. Export regularly for backup.')}</p></div>`;
}
const renderBeforeNotebook=render;
render=function(){
  renderBeforeNotebook();
  if(page==='notebook'){$('#app').innerHTML=notebookPage();localizePage()}
  if(page==='dictionary'&&query.trim()){
    document.querySelector('.dict-query-title')?.insertAdjacentHTML('beforeend',`<button class="secondary" id="note-add-query">${noteText('保存到笔记','Save to notebook')}</button>`);
  }
};
function exportNotebook(){
  const markdown=['# English Lab 学习笔记','',...state.notebook.map(item=>`## ${item.term}\n\n保存日期：${item.createdAt}\n\n${item.notes||'（尚未填写笔记）'}\n`)].join('\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));link.download='English-Lab-Notebook.md';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
document.addEventListener('click',clickEvent=>{
  const button=clickEvent.target.closest('button');if(!button)return;
  if(button.id==='note-add-query'&&page==='dictionary'){
    clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
    const term=query.trim();if(!term)return;
    const existing=state.notebook.find(item=>item.term.toLowerCase()===term.toLowerCase());
    if(existing){notebookSelected=existing.id;toast(noteText('已在笔记中','Already saved'));navigate('notebook');return}
    const item={id:crypto.randomUUID(),term,notes:'',createdAt:today()};state.notebook.push(item);notebookSelected=item.id;save();toast(noteText('已保存到笔记','Saved to notebook'));navigate('notebook');return;
  }
  if(page!=='notebook')return;
  const entryId=button.dataset.noteOpen;
  if(entryId||button.id==='note-save'||button.id==='note-delete'||button.id==='note-export'||button.dataset.noteLookup){
    clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
    if(entryId){notebookSelected=entryId;render();return}
    if(button.id==='note-save'){const item=state.notebook.find(entry=>entry.id===button.dataset.noteId);if(item){item.notes=document.getElementById('notebook-editor').value;save();toast(noteText('笔记已保存','Note saved'))}return}
    if(button.id==='note-delete'){state.notebook=state.notebook.filter(entry=>entry.id!==button.dataset.noteId);notebookSelected=state.notebook.at(-1)?.id||null;save();render();return}
    if(button.id==='note-export'){exportNotebook();return}
    if(button.dataset.noteLookup){query=button.dataset.noteLookup;navigate('dictionary')}
  }
},true);
render();
