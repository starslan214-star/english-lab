// 开放图书按固定书目直接读取纯文本，减少目录服务失败造成的导入中断。
const books=new Map([
  [11,{title:"Alice's Adventures in Wonderland",author:'Lewis Carroll'}],[55,{title:'The Wonderful Wizard of Oz',author:'L. Frank Baum'}],[84,{title:'Frankenstein',author:'Mary Shelley'}],[1342,{title:'Pride and Prejudice',author:'Jane Austen'}],[1661,{title:'The Adventures of Sherlock Holmes',author:'Arthur Conan Doyle'}],[17396,{title:'The Secret Garden',author:'Frances Hodgson Burnett'}]
]);
const bookCache=new Map();
const wordBookFiles=new Map([
  ['cet4-core','1523620217431_CET4luan_1.zip'],
  ['cet6-core','1521164660466_CET6luan_1.zip'],
  ['postgraduate-core','1521164661106_KaoYanluan_1.zip'],
  ['cet4-full','1524052539052_CET4luan_2.zip'],
  ['cet6-full','1524052554766_CET6_2.zip'],
  ['ielts','1521164624473_IELTSluan_2.zip'],
  ['toefl','1521164640451_TOEFL_2.zip'],
  ['gre','1521164637271_GRE_2.zip'],
  ['sat','1521164670910_SAT_2.zip'],
  ['gmat','1521164629611_GMATluan_2.zip'],
  ['junior','1521164647926_ChuZhong_2.zip'],
  ['senior','1521164675301_GaoZhong_2.zip']
]);
function cleanBookText(text){const start=text.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i),end=text.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);return text.slice(start>=0?text.indexOf('\n',start)+1:0,end>0?end:undefined).replace(/\r\n/g,'\n').trim().slice(0,1200000)}
async function fetchFirstText(urls){for(const url of urls){try{const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'text/plain'}});if(response.ok){const text=await response.text();if(text.length>500)return text}}catch{}}return ''}
export async function getOpenBook(id){const number=Number(id),metadata=books.get(number);if(!metadata)return null;const cached=bookCache.get(number);if(cached&&Date.now()-cached.at<86400000)return cached.value;const raw=await fetchFirstText([`https://www.gutenberg.org/cache/epub/${number}/pg${number}.txt`,`https://www.gutenberg.org/files/${number}/${number}-0.txt`,`https://www.gutenberg.org/files/${number}/${number}.txt`]);if(!raw)return null;const content=cleanBookText(raw);if(content.length<500)return null;const value={id:number,...metadata,content,source:'Project Gutenberg',sourcePage:`https://www.gutenberg.org/ebooks/${number}`};if(bookCache.size>=12)bookCache.delete(bookCache.keys().next().value);bookCache.set(number,{at:Date.now(),value});return value}
export async function getWordBookArchive(id){
  const file=wordBookFiles.get(id);if(!file)return null;
  const sources=[`https://cdn.jsdelivr.net/gh/kajweb/dict@master/book/${file}`,`https://raw.githubusercontent.com/kajweb/dict/master/book/${file}`,`https://github.com/kajweb/dict/raw/refs/heads/master/book/${file}`];
  for(const url of sources){try{const response=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{Accept:'application/zip'}});if(response.ok&&response.body)return new Response(response.body,{headers:{'Content-Type':'application/zip','Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename="${file}"`}})}catch{}}
  return null;
}
