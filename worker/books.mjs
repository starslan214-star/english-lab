// 按用户点击从 Gutendex 目录读取公版书元数据与纯文本，不批量抓取。
const allowedBooks=new Set([11,55,84,1342,1661,17396]);
const bookCache=new Map();

function cleanBookText(text){
  const start=text.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const end=text.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const body=text.slice(start>=0?text.indexOf('\n',start)+1:0,end>0?end:undefined).replace(/\r\n/g,'\n').trim();
  return body.slice(0,900000);
}

export async function getOpenBook(id){
  const number=Number(id);if(!allowedBooks.has(number))return null;
  const cached=bookCache.get(number);if(cached&&Date.now()-cached.at<86400000)return cached.value;
  const metadataResponse=await fetch(`https://gutendex.com/books/${number}/`,{signal:AbortSignal.timeout(8000)});
  if(!metadataResponse.ok)return null;
  const metadata=await metadataResponse.json(),formats=metadata.formats||{};
  const textUrl=formats['text/plain; charset=utf-8']||formats['text/plain; charset=us-ascii']||formats['text/plain'];
  if(!textUrl||!/^https:\/\//.test(textUrl))return null;
  const textResponse=await fetch(textUrl,{signal:AbortSignal.timeout(12000)});if(!textResponse.ok)return null;
  const content=cleanBookText(await textResponse.text());if(content.length<500)return null;
  const value={id:number,title:String(metadata.title||'Untitled').slice(0,160),author:String(metadata.authors?.[0]?.name||'Unknown').slice(0,120),content,source:'Project Gutenberg',sourcePage:`https://www.gutenberg.org/ebooks/${number}`};
  if(bookCache.size>=12)bookCache.delete(bookCache.keys().next().value);bookCache.set(number,{at:Date.now(),value});return value;
}
