// 本地图书库：导入 TXT/Markdown、点词查询、保存阅读状态，并备份全部学习数据。
NAV.splice(2,0,['library','▤','Library']);
uiTranslations.set('Library','我的图书');
state.library=Array.isArray(state.library)?state.library:[];
let libraryBookId=null;
const libraryText=(zh,en)=>uiLanguage==='zh'?zh:en;
const libraryLimit=350000;
const openBooks=[
  {id:11,title:'Alice’s Adventures in Wonderland',author:'Lewis Carroll',level:'A2+'},
  {id:55,title:'The Wonderful Wizard of Oz',author:'L. Frank Baum',level:'A2+'},
  {id:17396,title:'The Secret Garden',author:'Frances Hodgson Burnett',level:'B1'},
  {id:1661,title:'The Adventures of Sherlock Holmes',author:'Arthur Conan Doyle',level:'B1'},
  {id:84,title:'Frankenstein',author:'Mary Shelley',level:'B2'},
  {id:1342,title:'Pride and Prejudice',author:'Jane Austen',level:'B2'}
];
function openBookCatalog(){return `<section class="card open-library"><div class="mini-title"><h3>${libraryText('开放图书馆','Open book library')}</h3><span>Project Gutenberg</span></div><p>${libraryText('选择一本公版英文书，导入后全文在本站阅读。','Choose a public-domain English book and read the full text here.')}</p><div class="open-book-grid">${openBooks.map(book=>`<article><span>${book.level}</span><h4>${esc(book.title)}</h4><small>${esc(book.author)}</small><button class="secondary" data-open-book="${book.id}">${libraryText('导入并阅读','Import & read')}</button></article>`).join('')}</div><p id="open-library-message" class="muted-text">${libraryText('按需从 Gutendex 目录读取，正文来源为 Project Gutenberg。非美国地区请确认当地版权状态。','Loaded on demand through Gutendex; text comes from Project Gutenberg. Check local copyright law outside the U.S.')}</p></section>`}

function libraryListPage(){
  const books=state.library.slice().reverse();
  return `<div class="content library-page">${head(libraryText('个人阅读库','MY LIBRARY'),libraryText('导入自己的英文材料','Import your English reading'),libraryText('支持 TXT 和 Markdown。文件只保存在当前浏览器，不会上传到服务器。','TXT and Markdown stay in this browser and are never uploaded.'),`<span class="pill">${books.length} ${libraryText('本资料','items')}</span>`)}
  <div class="library-grid"><section class="card library-import"><div class="eyebrow">${libraryText('添加阅读材料','ADD READING')}</div><label for="library-title">${libraryText('标题','Title')}</label><input id="library-title" class="input" maxlength="120" placeholder="${libraryText('例如：我的第一篇英文文章','For example: My first English article')}"><label for="library-content">${libraryText('英文正文','English text')}</label><textarea id="library-content" class="input" rows="10" maxlength="${libraryLimit}" placeholder="${libraryText('在这里粘贴英文文章，或选择 TXT / Markdown 文件……','Paste an English article, or choose a TXT / Markdown file…')}"></textarea><div class="action-row"><button class="primary" id="library-add">${libraryText('保存到图书库','Save to library')}</button><label class="secondary file-button">${libraryText('选择文件','Choose file')}<input id="library-file" type="file" accept=".txt,.md,text/plain,text/markdown"></label></div><p id="library-message" class="muted-text">${libraryText('单篇最多约 35 万字符。受版权保护的内容请仅导入自己有权使用的副本。','Up to about 350,000 characters. Only import material you may legally use.')}</p></section>
  <section class="card"><div class="mini-title"><h3>${libraryText('我的资料','My reading')}</h3><span>${books.length}</span></div>${books.length?`<div class="library-list">${books.map(book=>`<article><button data-library-open="${esc(book.id)}"><b>${esc(book.title)}</b><small>${esc(book.createdAt)} · ${book.finished?libraryText('已读完','Finished'):libraryText('待读','To read')}</small></button><button class="library-delete" data-library-delete="${esc(book.id)}" aria-label="${libraryText('删除','Delete')} ${esc(book.title)}">×</button></article>`).join('')}</div>`:`<div class="library-empty"><b>${libraryText('图书库还是空的','Your library is empty')}</b><p>${libraryText('先粘贴一篇短文章。建议从 200—500 词的内容开始。','Start with a short article of 200–500 words.')}</p></div>`}</section></div>
  <section class="card library-backup"><div><div class="eyebrow">${libraryText('数据安全','DATA BACKUP')}</div><h3>${libraryText('备份全部学习记录','Back up all learning data')}</h3><p>${libraryText('导出单词进度、阅读记录、笔记和本地图书。恢复会合并到当前浏览器。','Export vocabulary progress, reading, notes and local books. Restore merges data into this browser.')}</p></div><div class="action-row"><button class="secondary" id="data-export">${libraryText('导出 JSON 备份','Export JSON')}</button><label class="secondary file-button">${libraryText('恢复备份','Restore backup')}<input id="data-import" type="file" accept="application/json,.json"></label></div></section></div>`;
}

function libraryReaderPage(){
  const book=state.library.find(item=>item.id===libraryBookId);if(!book)return libraryListPage();
  const paragraphs=book.content.split(/\n\s*\n/).filter(Boolean).map(paragraph=>`<p>${esc(paragraph).replace(/\b([A-Za-z][A-Za-z'-]{1,})\b/g,'<button data-library-lookup="$1">$1</button>').replace(/\n/g,'<br>')}</p>`).join('');
  const count=(book.content.match(/\b[A-Za-z][A-Za-z'-]*\b/g)||[]).length;
  return `<div class="content library-reader">${head(libraryText('沉浸阅读','FOCUSED READING'),esc(book.title),libraryText('点击任意英文单词即可进入词典查询。','Tap any English word to open the dictionary.'),`<span class="pill">${count} ${libraryText('词','words')}</span>`)}<div class="reader-actions"><button class="secondary" data-nav="library">← ${libraryText('返回图书库','Back to library')}</button><button class="primary" id="library-finish">${book.finished?libraryText('✓ 已读完','✓ Finished'):libraryText('标记已读完','Mark finished')}</button><button class="secondary" id="print">${libraryText('打印／保存 PDF','Print / Save PDF')}</button></div><article class="card imported-reading">${paragraphs}</article><p class="footer-note">${libraryText('本文来自你的本地导入。English Lab 不会将正文上传到服务器。','This text was imported locally. English Lab does not upload it.')}</p></div>`;
}

const renderBeforeLibrary=render;
render=function(){renderBeforeLibrary();if(page==='library'){$('#app').innerHTML=libraryListPage();document.querySelector('.library-grid')?.insertAdjacentHTML('beforebegin',openBookCatalog());localizePage()}if(page==='library-reader'){$('#app').innerHTML=libraryReaderPage();localizePage();document.title=`English Lab · ${libraryText('阅读','Reading')}`}};

function addLibraryBook(title,content){
  const clean=content.replace(/\r\n/g,'\n').trim();if(!clean){toast(libraryText('请先粘贴或选择英文内容','Add some English text first'));return false}if(clean.length>libraryLimit){toast(libraryText('内容过长，请拆分后导入','The text is too long; split it first'));return false}
  const item={id:crypto.randomUUID(),title:(title||clean.split('\n')[0]||libraryText('未命名文章','Untitled')).slice(0,120),content:clean,createdAt:today(),finished:false};state.library.push(item);save();libraryBookId=item.id;page='library-reader';render();return true;
}
function downloadJson(){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify({format:'english-lab-backup',version:1,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}));link.download=`English-Lab-Backup-${today()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}

document.addEventListener('change',async event=>{
  if(event.target.id==='library-file'){const file=event.target.files?.[0];if(!file)return;if(file.size>libraryLimit*2){toast(libraryText('文件过大，请选择较短的文章','File too large'));event.target.value='';return}const content=await file.text();document.getElementById('library-title').value=file.name.replace(/\.(txt|md)$/i,'');document.getElementById('library-content').value=content.slice(0,libraryLimit);document.getElementById('library-message').textContent=libraryText('文件已读取，确认标题后点击保存。','File loaded. Check the title, then save.');event.target.value=''}
  if(event.target.id==='data-import'){const file=event.target.files?.[0];if(!file)return;try{const backup=JSON.parse(await file.text());if(backup?.format!=='english-lab-backup'||!backup.state||typeof backup.state!=='object')throw new Error();const restored=backup.state;state={...state,...restored,reviews:{...state.reviews,...restored.reviews},learned:[...new Set([...(state.learned||[]),...(restored.learned||[])])],read:[...new Set([...(state.read||[]),...(restored.read||[])])],events:[...(state.events||[]),...(restored.events||[])],notebook:[...(state.notebook||[]),...(restored.notebook||[])],library:[...(state.library||[]),...(restored.library||[])]};save();toast(libraryText('备份已恢复','Backup restored'));render()}catch{toast(libraryText('备份文件无效','Invalid backup file'))}event.target.value=''}
});

document.addEventListener('click',async clickEvent=>{
  const button=clickEvent.target.closest('button');if(!button)return;
  if(button.id==='library-add'&&page==='library'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();addLibraryBook(document.getElementById('library-title').value.trim(),document.getElementById('library-content').value);return}
  if(button.dataset.openBook&&page==='library'){
    clickEvent.preventDefault();clickEvent.stopImmediatePropagation();button.disabled=true;button.textContent=libraryText('正在导入……','Importing…');
    const message=document.getElementById('open-library-message');message.textContent=libraryText('正在读取图书正文，请稍候……','Loading the book text…');
    try{const response=await fetch('/api/books/'+button.dataset.openBook),data=await response.json();if(!response.ok)throw new Error(data.error||libraryText('导入失败','Import failed'));addLibraryBook(`${data.title} — ${data.author}`,data.content)}
    catch(error){message.textContent=error.message;button.disabled=false;button.textContent=libraryText('重试导入','Try again')}return
  }
  if(button.dataset.libraryOpen){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();libraryBookId=button.dataset.libraryOpen;page='library-reader';render();return}
  if(button.dataset.libraryLookup){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();query=button.dataset.libraryLookup.toLowerCase();navigate('dictionary');return}
  if(button.dataset.libraryDelete){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();if(confirm(libraryText('确定删除这篇本地资料吗？','Delete this local reading?'))){state.library=state.library.filter(item=>item.id!==button.dataset.libraryDelete);save();render()}return}
  if(button.id==='library-finish'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();const book=state.library.find(item=>item.id===libraryBookId);if(book){book.finished=true;if(!state.read.includes('library:'+book.id))state.read.push('library:'+book.id);event('read','library:'+book.id);save();toast(libraryText('已记录本次阅读','Reading recorded'));render()}return}
  if(button.id==='data-export'&&page==='library'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();downloadJson()}
},true);
render();
