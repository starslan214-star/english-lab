// 验证页面路由、会话加密与 DeepSeek 代理的关键行为。
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../dist/server/index.js';

const origin='https://english-lab.test';
const env={ENGLISH_LAB_COOKIE_KEY:'ab'.repeat(32)};
const page=await worker.fetch(new Request(origin+'/'),env);
assert.equal(page.status,200);
assert.match(await page.text(),/language-toggle|i18n\.js/);
const vocabularyPage=await worker.fetch(new Request(origin+'/vocab-data.js'),env);
assert.equal(vocabularyPage.status,200);
assert.match(await vocabularyPage.text(),/VOCAB_LIBRARY/);
const dictionaryUi=await worker.fetch(new Request(origin+'/dictionary-ui.js'),env);
assert.equal(dictionaryUi.status,200);
assert.match(await dictionaryUi.text(),/百度翻译/);
const notebookUi=await worker.fetch(new Request(origin+'/notebook.js'),env);
assert.equal(notebookUi.status,200);
assert.match(await notebookUi.text(),/学习笔记/);
const libraryUi=await worker.fetch(new Request(origin+'/library.js'),env);
assert.equal(libraryUi.status,200);
assert.match(await libraryUi.text(),/本地图书库/);
const adaptiveGameUi=await worker.fetch(new Request(origin+'/adaptive-game.js'),env);
assert.equal(adaptiveGameUi.status,200);
assert.match(await adaptiveGameUi.text(),/自适应单词游戏/);
const versionUi=await worker.fetch(new Request(origin+'/version.js'),env);
assert.equal(versionUi.status,200);
assert.match(await versionUi.text(),/1\.5\.0/);
const datamuseUi=await worker.fetch(new Request(origin+'/datamuse-dictionary.js'),env);
assert.equal(datamuseUi.status,200);
assert.match(await datamuseUi.text(),/Wiktionary \+ WordNet/);
const settingsUi=await worker.fetch(new Request(origin+'/settings.js'),env);
assert.equal(settingsUi.status,200);
assert.match(await settingsUi.text(),/下载完整备份/);
const reviewCore=await worker.fetch(new Request(origin+'/review-core.js'),env);
assert.equal(reviewCore.status,200);
assert.match(await reviewCore.text(),/nextReview/);
const first=await worker.fetch(new Request(origin+'/api/deepseek/status'),env);
assert.deepEqual(await first.json(),{configured:false,model:'deepseek-flash'});
const rejected=await worker.fetch(new Request(origin+'/api/deepseek/key',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://other.test'},body:JSON.stringify({key:'sk-test-key-123456789'})}),env);
assert.equal(rejected.status,403);
const originalFetch=globalThis.fetch;
let emptyChat=false;
globalThis.fetch=async (request,options)=>{
  const url=typeof request==='string'?request:request.url;
  if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'deepseek-flash'}]}),{status:200});
  if(url.endsWith('/chat/completions')){
    const body=JSON.parse(options.body);
    assert.deepEqual(body.thinking,{type:'disabled'});
    return new Response(JSON.stringify({choices:[{message:{content:emptyChat?'':'Hello. A bug is a problem in software.'},finish_reason:emptyChat?'length':'stop'}]}),{status:200});
  }
  throw new Error('意外请求');
};
try{
  const key='sk-test-key-123456789';
  const saved=await worker.fetch(new Request(origin+'/api/deepseek/key',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify({key})}),env);
  assert.equal(saved.status,200);
  const cookie=saved.headers.get('Set-Cookie');
  assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
  assert.ok(!cookie.includes(key));
  const status=await worker.fetch(new Request(origin+'/api/deepseek/status',{headers:{Cookie:cookie.split(';')[0]}}),env);
  assert.equal((await status.json()).configured,true);
  const chat=await worker.fetch(new Request(origin+'/api/deepseek/chat',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:cookie.split(';')[0]},body:JSON.stringify({model:'deepseek-flash',messages:[{role:'user',content:'What is a bug?'}]})}),env);
  assert.equal(chat.status,200);
  assert.match((await chat.json()).reply,/A bug/);
  const lookup=await worker.fetch(new Request(origin+'/api/deepseek/lookup',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:cookie.split(';')[0]},body:JSON.stringify({term:'regression testing'})}),env);
  assert.equal(lookup.status,200);
  assert.match((await lookup.json()).reply,/A bug/);
  emptyChat=true;
  const empty=await worker.fetch(new Request(origin+'/api/deepseek/chat',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:cookie.split(';')[0]},body:JSON.stringify({model:'deepseek-flash',messages:[{role:'user',content:'Explain ability'}]})}),env);
  assert.equal(empty.status,502);
  assert.match((await empty.json()).error,/长度上限/);
  const removed=await worker.fetch(new Request(origin+'/api/deepseek/key',{method:'DELETE',headers:{'Content-Type':'application/json','Origin':origin},body:'{}'}),env);
  assert.equal(removed.status,200);
  assert.match(removed.headers.get('Set-Cookie'),/Max-Age=0/);
}finally{globalThis.fetch=originalFetch}
const baiduCalls=[];
let baiduBlocked=false;
globalThis.fetch=async (url,options)=>{
  if(String(url).includes('fanyi-api.baidu.com')){
    const params=new URLSearchParams(options.body);
    baiduCalls.push(params);
    const expected=createHash('md5').update(params.get('appid')+params.get('q')+params.get('salt')+'secret123').digest('hex');
    assert.equal(params.get('sign'),expected);
    return new Response(JSON.stringify(baiduBlocked?{error_code:'58003'}:{from:params.get('from'),to:params.get('to'),trans_result:[{src:params.get('q'),dst:'能力'}]}));
  }
  throw new Error('意外请求');
};
try{
  const unconnected=await worker.fetch(new Request(origin+'/api/baidu/status'),env);
  assert.deepEqual(await unconnected.json(),{configured:false});
  const invalidOrigin=await worker.fetch(new Request(origin+'/api/baidu/key',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://other.test'},body:JSON.stringify({appid:'123456',key:'secret123'})}),env);
  assert.equal(invalidOrigin.status,403);
  const saved=await worker.fetch(new Request(origin+'/api/baidu/key',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify({appid:'123456',key:'secret123'})}),env);
  assert.equal(saved.status,200);
  const cookie=saved.headers.get('Set-Cookie');
  assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
  assert.ok(!cookie.includes('secret123'));
  const sessionCookie=cookie.split(';')[0];
  const connected=await worker.fetch(new Request(origin+'/api/baidu/status',{headers:{Cookie:sessionCookie}}),env);
  assert.deepEqual(await connected.json(),{configured:true});
  const translated=await worker.fetch(new Request(origin+'/api/baidu/translate',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:sessionCookie},body:JSON.stringify({text:'ability',from:'en',to:'zh'})}),env);
  assert.equal(translated.status,200);
  assert.equal((await translated.json()).results[0].target,'能力');
  assert.equal(baiduCalls.length,2);
  baiduBlocked=true;
  const blocked=await worker.fetch(new Request(origin+'/api/baidu/translate',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:sessionCookie},body:JSON.stringify({text:'ability',from:'en',to:'zh'})}),env);
  assert.equal(blocked.status,502);
  assert.match((await blocked.json()).error,/封禁了本站调用 IP/);
  const removed=await worker.fetch(new Request(origin+'/api/baidu/key',{method:'DELETE',headers:{'Content-Type':'application/json','Origin':origin,Cookie:sessionCookie},body:'{}'}),env);
  assert.match(removed.headers.get('Set-Cookie'),/Max-Age=0/);
}finally{globalThis.fetch=originalFetch}
globalThis.fetch=async url=>{
  if(String(url).includes('gutendex.com/books/11'))return new Response(JSON.stringify({title:"Alice's Adventures in Wonderland",authors:[{name:'Carroll, Lewis'}],formats:{'text/plain; charset=utf-8':'https://www.gutenberg.org/cache/epub/11/pg11.txt'}}));
  if(String(url).includes('gutenberg.org/cache/epub/11/'))return new Response('*** START OF THE PROJECT GUTENBERG EBOOK ALICE ***\n'+('Alice followed the White Rabbit into Wonderland.\n\n'.repeat(20))+'*** END OF THE PROJECT GUTENBERG EBOOK ALICE ***');
  if(String(url).includes('dictionaryapi.dev'))return new Response(JSON.stringify([{meanings:[{definitions:[{definition:'the power to do something',example:'She has the ability to learn quickly.'}]}]}]));
  if(String(url).includes('api.datamuse.com/words?sp='))return new Response(JSON.stringify([{word:'ability',defs:['n\tthe quality of being able to do something'],tags:['pron:əˈbɪləti']}]))
  if(String(url).includes('api.datamuse.com/words?rel_syn='))return new Response(JSON.stringify([{word:'capability'},{word:'capacity'}]));
  if(String(url).includes('blog.google'))return new Response('<rss><channel><item><title>AI &amp; testing</title><link>https://blog.google/example/</link><pubDate>Tue, 15 Sep 2026 12:00:00 GMT</pubDate></item></channel></rss>');
  if(String(url).includes('selenium.dev'))return new Response('<a href="/blog/2026/selenium-test/" class=selenium-link>Selenium &amp; testing</a></h5><p><small>September 9, 2026</small>');
  throw new Error('意外的文章来源');
};
try{
  const dictionary=await worker.fetch(new Request(origin+'/api/dictionary/ability'),{});
  assert.equal(dictionary.status,200);
  assert.equal((await dictionary.json()).definition,'the power to do something');
  const datamuse=await worker.fetch(new Request(origin+'/api/datamuse/ability'),{});
  assert.equal(datamuse.status,200);
  const datamuseData=await datamuse.json();
  assert.equal(datamuseData.definitions[0].partOfSpeech,'n');
  assert.deepEqual(datamuseData.related,['capability','capacity']);
  const openBook=await worker.fetch(new Request(origin+'/api/books/11'),{});
  assert.equal(openBook.status,200);
  assert.match((await openBook.json()).content,/White Rabbit/);
  const news=await worker.fetch(new Request(origin+'/api/news'),{});
  assert.equal(news.status,200);
  const items=(await news.json()).items;
  assert.equal(items.length,2);
  assert.deepEqual(items.map(item=>item.topic),['ai','testing']);
  assert.equal(items[0].title,'AI & testing');
}finally{globalThis.fetch=originalFetch}
console.log('Worker 检查通过');
