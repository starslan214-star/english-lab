// 官方文章列表只显示标题、日期与原文链接；入门练习仍使用站内原创短文。
let newsItems=[];
let newsLoaded=false;
let newsLoading=false;
let newsError='';
let newsPartial=false;
let newsFilter='all';
const newsText=(zh,en)=>uiLanguage==='zh'?zh:en;
function latestNewsMarkup(){
  const filtered=newsFilter==='all'?[...newsItems.filter(item=>item.topic==='ai').slice(0,4),...newsItems.filter(item=>item.topic==='testing').slice(0,4)].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)):newsItems.filter(item=>item.topic===newsFilter);
  const tabs=[['all',newsText('全部','All')],['testing',newsText('软件测试','Testing')],['ai','AI']]
    .map(([id,label])=>`<button class="chip ${newsFilter===id?'active':''}" data-news-filter="${id}">${label}</button>`).join('');
  let body='';
  if(newsLoading)body=`<div class="card news-message">${newsText('正在读取官方文章……','Loading official articles…')}</div>`;
  else if(newsError)body=`<div class="card news-message">${newsText('暂时无法读取最新文章。你仍可完成下方分级练习，或直接访问','Latest articles are temporarily unavailable. You can use the graded reading below or visit')} <a href="https://blog.google/innovation-and-ai/technology/ai/" target="_blank" rel="noopener noreferrer">Google AI</a> ${newsText('和','and')} <a href="https://www.selenium.dev/blog/" target="_blank" rel="noopener noreferrer">Selenium Blog</a>。</div>`;
  else if(!filtered.length)body=`<div class="card news-message">${newsText('这个分类暂时没有可显示的文章。','No articles are available in this topic right now.')}</div>`;
  else body=`<div class="news-grid">${filtered.slice(0,8).map(item=>`<article class="card news-card"><div class="news-meta"><span class="tag">${item.topic==='ai'?'AI':newsText('软件测试','TESTING')}</span><span>${esc(item.publishedAt.slice(0,10))} · ${esc(item.source)}</span></div><h3>${esc(item.title)}</h3><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${newsText('打开官方原文 ↗','Read the official article ↗')}</a></article>`).join('')}</div>`;
  return `<section class="latest-news"><div class="mini-title"><div><div class="eyebrow">${newsText('官方来源','OFFICIAL SOURCES')}</div><h2 class="section-heading" style="margin:5px 0 0">${newsText('近期技术文章','Recent tech articles')}</h2></div><span>${newsPartial?newsText('部分来源暂时不可用','Some sources unavailable'):newsText('标题与日期来自原站','Titles and dates from source')}</span></div><p class="muted-text">${newsText('这些是官方原文链接，通常比 A1 练习更难。建议先完成下方短文，再尝试阅读标题和原文。','These official articles may be harder than A1 practice. Try the short reading below first, then explore the headlines and original articles.')}</p><div class="category-row" style="margin:17px 0">${tabs}</div>${body}</section>`;
}
function addNewsToPage(){
  if(page==='reading'){
    const content=$('#app .content');if(!content)return;
    content.querySelector('.page-head')?.insertAdjacentHTML('afterend',latestNewsMarkup());
    content.querySelector(':scope > .category-row')?.insertAdjacentHTML('beforebegin',`<h2 class="section-heading">${newsText('A1 分级练习','A1 graded practice')}</h2>`);
  }
  if(page==='today'&&newsItems.length){
    const item=newsItems[0],card=$('#app .article-card');
    card?.insertAdjacentHTML('afterend',`<section class="card news-card news-home"><div class="news-meta"><span class="tag">${newsText('近期原文','RECENT ARTICLE')}</span><span>${esc(item.publishedAt.slice(0,10))} · ${esc(item.source)}</span></div><h3>${esc(item.title)}</h3><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${newsText('打开官方原文 ↗','Read the official article ↗')}</a></section>`);
  }
}
const previousRenderWithAi=render;
render=function(){previousRenderWithAi();addNewsToPage()};
document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-news-filter]');
  if(!button)return;
  newsFilter=button.dataset.newsFilter;render();
});
async function loadNews(){
  if(newsLoading)return;
  newsLoading=true;newsError='';render();
  try{
    const response=await fetch('/api/news',{cache:'no-store'});
    const result=await response.json();
    if(!response.ok||!Array.isArray(result.items))throw new Error('文章接口不可用');
    newsItems=result.items.filter(item=>['ai','testing'].includes(item.topic)&&typeof item.title==='string'&&typeof item.url==='string'&&typeof item.publishedAt==='string');
    newsPartial=Boolean(result.partial||result.stale);newsLoaded=true;
    if(!newsItems.length)newsError='暂无文章';
  }catch(error){newsError=error.message}
  newsLoading=false;render();
}
loadNews();
