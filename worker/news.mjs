// 从固定的官方来源读取文章标题和发布日期，不复制外部文章全文。
const sources=[
  {topic:'ai',name:'Google AI',feed:'https://blog.google/innovation-and-ai/technology/ai/rss/'},
  {topic:'testing',name:'Selenium Blog',feed:'https://www.selenium.dev/blog/'}
];
let cached=null;
let cachedAt=0;
const cacheDuration=20*60*1000;

function decodeEntities(value){
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,number)=>{
    const code=number[0].toLowerCase()==='x'?parseInt(number.slice(1),16):parseInt(number,10);
    return Number.isFinite(code)&&code<=0x10ffff?String.fromCodePoint(code):'';
  }).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[name.toLowerCase()]));
}
function plain(value){return decodeEntities(value.replace(/<[^>]*>/g,'')).trim().slice(0,180)}
function tag(xml,name){return xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]||''}
function safeLink(raw,host){
  try{const url=new URL(decodeEntities(raw.trim()));return url.protocol==='https:'&&url.hostname===host?url.href:null}catch{return null}
}
export function parseGoogleFeed(xml){
  const posts=[];
  for(const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)){
    const item=match[1],link=safeLink(tag(item,'link'),'blog.google'),title=plain(tag(item,'title'));
    const date=new Date(tag(item,'pubDate'));
    if(link&&title&&!Number.isNaN(date.getTime()))posts.push({topic:'ai',source:'Google AI',title,url:link,publishedAt:date.toISOString()});
  }
  return posts.slice(0,8);
}
export function parseSeleniumBlog(html){
  const posts=[];
  const pattern=/<a href=(?:"|')?(\/blog\/\d{4}\/[^ >"']+)(?:"|')? class=selenium-link>([\s\S]*?)<\/a><\/h5><p[^>]*><small[^>]*>([\s\S]*?)<\/small>/g;
  for(const match of html.matchAll(pattern)){
    const link=safeLink(`https://www.selenium.dev${match[1]}`,'www.selenium.dev'),title=plain(match[2]),localDate=new Date(plain(match[3]));
    const date=new Date(Date.UTC(localDate.getFullYear(),localDate.getMonth(),localDate.getDate(),12));
    if(link&&title&&!Number.isNaN(date.getTime()))posts.push({topic:'testing',source:'Selenium Blog',title,url:link,publishedAt:date.toISOString()});
  }
  return posts.slice(0,8);
}
async function readSource(source){
  const response=await fetch(source.feed,{headers:{Accept:'application/rss+xml,text/html;q=0.9'},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw new Error(`上游返回 ${response.status}`);
  const content=await response.text();
  if(content.length>1500000)throw new Error('订阅源过大');
  return source.topic==='ai'?parseGoogleFeed(content):parseSeleniumBlog(content);
}
export async function getNews(){
  if(cached&&Date.now()-cachedAt<cacheDuration)return cached;
  const results=await Promise.allSettled(sources.map(readSource));
  const items=results.flatMap(result=>result.status==='fulfilled'?result.value:[]);
  const byUrl=new Map(items.map(item=>[item.url,item]));
  const sorted=[...byUrl.values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  const failures=results.filter(result=>result.status==='rejected').length;
  if(!sorted.length&&cached)return {...cached,stale:true};
  const output={items:sorted,fetchedAt:new Date().toISOString(),partial:failures>0,stale:false};
  if(sorted.length){cached=output;cachedAt=Date.now()}
  return output;
}
