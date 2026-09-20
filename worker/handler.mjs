// English Lab 服务端：安全保存 DeepSeek 会话密钥，并提供静态页面。
import {getNews} from './news.mjs';
import {getDictionaryDefinition} from './dictionary.mjs';
import {translateBaidu} from './baidu.mjs';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const allowedModels = new Set(['deepseek-flash', 'deepseek-v4-pro']);
const systemPrompt = '你是面向零基础成年人的英语老师。优先用 A1 级简单英文解释，并用一两句中文帮助理解。结合日常英语、软件测试与 AI 词汇给出简短例句。回答简洁，鼓励用户自己尝试。不要声称拥有实时新闻或词典资料。';
const dictionaryPrompt = '你是英语学习助教。用户输入英文单词、短语或中文词语。请直接用清晰的纯文本分段回答：英文对应词与词性、中文意思、简单英英解释、常见固定搭配及中文释义、用法提醒、一个自然英文例句及中文翻译。若输入是中文，先给常用英文对应词。只给有把握的搭配；不确定就写“暂无可靠搭配”。不要编造词典引文或声称结果来自授权词典。回答尽量简短。';
const mimeTypes = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml',webmanifest:'application/manifest+json; charset=utf-8'};

function json(data,status=200,headers={}){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
}
function bytesToBase64(bytes){return btoa(String.fromCharCode(...bytes))}
function base64ToBytes(value){return Uint8Array.from(atob(value),char=>char.charCodeAt(0))}
async function encryptionKey(secret){
  if(!secret)throw new Error('服务端未配置会话密钥');
  const raw=Uint8Array.from(secret.match(/.{1,2}/g).map(hex=>parseInt(hex,16)));
  if(raw.length!==32)throw new Error('服务端会话密钥无效');
  return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function seal(value,secret){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(secret),encoder.encode(value)));
  return bytesToBase64(iv)+'.'+bytesToBase64(encrypted);
}
async function unseal(value,secret){
  try{
    const [ivText,cipherText]=value.split('.');
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(ivText)},await encryptionKey(secret),base64ToBytes(cipherText));
    return decoder.decode(plaintext);
  }catch{return null}
}
function readNamedCookie(request,name){
  const cookie=request.headers.get('Cookie')||'';
  return cookie.split(';').map(item=>item.trim()).find(item=>item.startsWith(name+'='))?.slice(name.length+1)||null;
}
function readCookie(request){return readNamedCookie(request,'el_deepseek')}
function cookieHeader(value){return `el_deepseek=${value}; Path=/; HttpOnly; Secure; SameSite=Strict`}
function requireSameOrigin(request){
  const origin=request.headers.get('Origin');
  return origin===new URL(request.url).origin&&request.headers.get('Content-Type')?.startsWith('application/json');
}
async function parseBody(request){
  const size=Number(request.headers.get('Content-Length')||0);
  if(size>20000)return null;
  const text=await request.text();
  if(text.length>20000)return null;
  try{return JSON.parse(text)}catch{return null}
}
async function deepSeek(path,key,options={}){
  const response=await fetch(`https://api.deepseek.com${path}`,{...options,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers}});
  const data=await response.json().catch(()=>({}));
  return {response,data};
}
async function handleApi(request,env,path){
  if(path.startsWith('/api/dictionary/')&&request.method==='GET'){
    let name;
    try{name=decodeURIComponent(path.slice('/api/dictionary/'.length)).toLowerCase()}catch{return json({error:'单词格式无效。'},400)}
    if(!/^[a-z][a-z -]{0,44}$/.test(name))return json({error:'单词格式无效。'},400);
    try{const result=await getDictionaryDefinition(name);return result?json(result):json({error:'暂未收录该词。'},404)}catch{return json({error:'英英词典暂时不可用。'},503)}
  }
  if(path==='/api/news'&&request.method==='GET'){
    try{return json(await getNews())}catch{return json({items:[],partial:true,error:'暂时无法读取文章来源。'},503)}
  }
  if(!env.ENGLISH_LAB_COOKIE_KEY)return json({error:'服务端尚未配置，请稍后再试。'},503);
  if(path==='/api/baidu/status'&&request.method==='GET'){
    const encrypted=readNamedCookie(request,'el_baidu');
    const value=encrypted?await unseal(encrypted,env.ENGLISH_LAB_COOKIE_KEY):null;
    return json({configured:Boolean(value)});
  }
  if(path.startsWith('/api/baidu/')){
    if(!requireSameOrigin(request))return json({error:'请求来源或格式无效。'},403);
    if(path==='/api/baidu/key'&&request.method==='DELETE')return json({configured:false},200,{'Set-Cookie':'el_baidu=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
    if(path==='/api/baidu/key'&&request.method==='POST'){
      const body=await parseBody(request),appid=body?.appid?.trim(),key=body?.key?.trim();
      if(typeof appid!=='string'||typeof key!=='string'||appid.length<4||appid.length>100||key.length<8||key.length>200)return json({error:'请输入有效的百度翻译 APP ID 和密钥。'},400);
      try{
        await translateBaidu('hello','en','zh',{appid,key});
        const encrypted=await seal(JSON.stringify({appid,key}),env.ENGLISH_LAB_COOKIE_KEY);
        return json({configured:true},200,{'Set-Cookie':`el_baidu=${encrypted}; Path=/; HttpOnly; Secure; SameSite=Strict`});
      }catch(error){return json({error:error.message||'验证失败，请检查 APP ID 和密钥。'},502)}
    }
    if(path==='/api/baidu/translate'&&request.method==='POST'){
      const encrypted=readNamedCookie(request,'el_baidu');
      const plain=encrypted?await unseal(encrypted,env.ENGLISH_LAB_COOKIE_KEY):null;
      if(!plain)return json({error:'请先连接百度翻译。'},401);
      const body=await parseBody(request),text=body?.text?.trim(),from=body?.from,to=body?.to;
      if(typeof text!=='string'||text.length<1||text.length>900||!['en','zh'].includes(from)||!['en','zh'].includes(to)||from===to)return json({error:'请填写不超过 900 字的中英文查询内容。'},400);
      try{return json(await translateBaidu(text,from,to,JSON.parse(plain)))}catch(error){return json({error:error.message||'百度翻译暂时不可用。'},502)}
    }
  }
  if(path==='/api/deepseek/status'&&request.method==='GET'){
    const key=readCookie(request)?await unseal(readCookie(request),env.ENGLISH_LAB_COOKIE_KEY):null;
    return json({configured:Boolean(key),model:'deepseek-flash'});
  }
  if(!requireSameOrigin(request))return json({error:'请求来源或格式无效。'},403);
  if(path==='/api/deepseek/lookup'&&request.method==='POST'){
    const encrypted=readCookie(request),key=encrypted?await unseal(encrypted,env.ENGLISH_LAB_COOKIE_KEY):null;
    if(!key)return json({error:'请先在「AI 助教」中连接 DeepSeek。'},401);
    const body=await parseBody(request),term=body?.term?.trim();
    if(typeof term!=='string'||term.length<1||term.length>200)return json({error:'请输入不超过 200 字的词语或短句。'},400);
    try{
      const {response,data}=await deepSeek('/chat/completions',key,{method:'POST',body:JSON.stringify({model:'deepseek-flash',messages:[{role:'system',content:dictionaryPrompt},{role:'user',content:term}],stream:false,thinking:{type:'disabled'},max_tokens:1100})});
      if(!response.ok)return json({error:response.status===401?'DeepSeek Key 已失效，请重新连接。':response.status===402?'DeepSeek 账户额度不足。':'AI 词典暂时无法生成结果。'},response.status===401?401:502);
      const reply=data.choices?.[0]?.message?.content?.trim();
      if(!reply)return json({error:'模型没有返回正文，请稍后重试。'},502);
      return json({reply,source:'DeepSeek AI'});
    }catch{return json({error:'AI 词典暂时无法连接。'},502)}
  }
  if(path==='/api/deepseek/key'&&request.method==='POST'){
    const body=await parseBody(request),key=body?.key?.trim();
    if(typeof key!=='string'||key.length<16||key.length>300)return json({error:'请输入有效的 DeepSeek API Key。'},400);
    try{
      const {response}=await deepSeek('/models',key);
      if(!response.ok)return json({error:response.status===401?'Key 无效，请检查后重试。':'DeepSeek 验证失败，请稍后重试。'},response.status===401?401:502);
      const encrypted=await seal(key,env.ENGLISH_LAB_COOKIE_KEY);
      return json({configured:true},200,{'Set-Cookie':cookieHeader(encrypted)});
    }catch{return json({error:'暂时无法连接 DeepSeek，请稍后重试。'},502)}
  }
  if(path==='/api/deepseek/key'&&request.method==='DELETE'){
    return json({configured:false},200,{'Set-Cookie':cookieHeader('')+'; Max-Age=0'});
  }
  if(path==='/api/deepseek/chat'&&request.method==='POST'){
    const encrypted=readCookie(request),key=encrypted?await unseal(encrypted,env.ENGLISH_LAB_COOKIE_KEY):null;
    if(!key)return json({error:'请先输入并验证 DeepSeek API Key。'},401);
    const body=await parseBody(request),messages=body?.messages,model=body?.model||'deepseek-flash';
    if(!allowedModels.has(model)||!Array.isArray(messages)||messages.length<1||messages.length>10)return json({error:'对话格式不正确。'},400);
    const clean=[];
    for(const item of messages){
      if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string'||item.content.length>4000)return json({error:'对话内容不正确或过长。'},400);
      clean.push({role:item.role,content:item.content});
    }
    if(clean.at(-1).role!=='user')return json({error:'请输入问题。'},400);
    try{
      const {response,data}=await deepSeek('/chat/completions',key,{method:'POST',body:JSON.stringify({model,messages:[{role:'system',content:systemPrompt},...clean],stream:false,thinking:{type:'disabled'},max_tokens:900})});
      if(!response.ok){
        const message=response.status===401?'Key 已失效，请重新配置。':response.status===402?'DeepSeek 账户额度不足，请到 DeepSeek 平台检查。':response.status===429?'提问过于频繁，请稍后重试。':'DeepSeek 请求失败，请稍后重试。';
        return json({error:message},response.status===401?401:502);
      }
      const content=data.choices?.[0]?.message?.content;
      const reply=typeof content==='string'?content.trim():Array.isArray(content)?content.filter(part=>part?.type==='text').map(part=>part.text||'').join('').trim():'';
      if(!reply)return json({error:data.choices?.[0]?.finish_reason==='length'?'模型输出达到长度上限，请缩短问题后重试。':'模型没有返回正文，请稍后重试。'},502);
      return json({reply});
    }catch{return json({error:'暂时无法连接 DeepSeek，请稍后重试。'},502)}
  }
  return json({error:'未找到接口。'},404);
}
export function createHandler(assets){
  return {async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(path.startsWith('/api/'))return handleApi(request,env,path);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    const name=path==='/'?'index.html':decodeURIComponent(path.slice(1));
    if(name.includes('..')||!Object.hasOwn(assets,name))return new Response('Not found',{status:404});
    const extension=name.split('.').pop(),headers={'Content-Type':mimeTypes[extension]||'application/octet-stream','X-Content-Type-Options':'nosniff'};
    return new Response(request.method==='HEAD'?null:assets[name],{headers});
  }};
}
