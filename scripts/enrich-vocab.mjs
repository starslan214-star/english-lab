// 词库增强管道：在现有 vocab-data.js 基础上补充
//   def（ECDICT 英英释义）、ex/exzh（kajweb 词书例句+中文翻译）、cefr（CEFR-J 1.6）、tracks（三条学习路线）。
// 数据来源与许可：
//   - 原词表：WordTyper 开放词库（声明见 LICENSES/WORDTYPER-NOTICE.md）
//   - ECDICT：MIT（LICENSES/ECDICT-LICENSE.txt）
//   - kajweb/dict：无许可证，仅限本地个人使用，禁止再分发
//   - CEFR-J Wordlist 1.6：正确引用后可用于研究/教育（东京外国语大学）
// 用法：node scripts/enrich-vocab.mjs（需要 data-src/ 下的原始数据）
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {existsSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const dataDir=new URL('data-src/',root);

// ---------- 1. 读取现有词库（支持旧四元组格式与已增强的对象格式） ----------
const vocabSource=await readFile(new URL('dist/vocab-data.js',root),'utf8');
const jsonText=vocabSource.slice(vocabSource.indexOf('['),vocabSource.lastIndexOf(']')+1);
const parsed=JSON.parse(jsonText);
const baseFile=new URL('base-vocab.json',dataDir);
let baseEntries,baseIsObject;
if(Array.isArray(parsed[0])){
  baseEntries=parsed;baseIsObject=false;
  await writeFile(baseFile,JSON.stringify(parsed));
  console.log('基础四元组已备份到 data-src/base-vocab.json');
}else{
  // dist 已是增强格式：优先用备份的基础四元组，保持脚本可重复运行。
  baseEntries=existsSync(baseFile)?JSON.parse(await readFile(baseFile,'utf8')):parsed;
  baseIsObject=true;
}
console.log(`现有词条：${baseEntries.length}`);

// ---------- 2. ECDICT（流式解析 CSV，仅保留命中的词） ----------
const wanted=new Set(baseEntries.map(entry=>entry[0]));
const ecdict=new Map();
if(existsSync(new URL('ecdict.csv',dataDir))){
  const rl=createInterface({input:createReadStream(new URL('ecdict.csv',dataDir))});
  let header=null,buffer='',quoteCount=0;
  const parseLine=line=>{
    const out=[];let cur='',inQ=false;
    for(let i=0;i<line.length;i++){const ch=line[i];
      if(inQ){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++}else inQ=false}else cur+=ch}
      else if(ch==='"')inQ=true;
      else if(ch===','){out.push(cur);cur=''}
      else cur+=ch}
    out.push(cur);return out};
  for await(let line of rl){
    if(buffer){line=buffer+'\n'+line;buffer=''}
    const marks=(line.match(/"/g)||[]).length;
    if(marks%2===1){buffer=line;continue}  // 引号未闭合：字段含换行，与下一行拼接
    const cells=parseLine(line);
    if(!header){header=cells;continue}
    const row=Object.fromEntries(header.map((key,index)=>[key,cells[index]??'']));
    const word=row.word?.toLowerCase();
    if(!word||!wanted.has(word)||ecdict.has(word))continue;
    ecdict.set(word,row);
  }
  console.log(`ECDICT 命中：${ecdict.size}/${wanted.size}`);
}else console.log('警告：缺少 data-src/ecdict.csv，跳过英英释义与词频');

// ---------- 3. kajweb 词书例句（JSONL，仅本地使用） ----------
const examples=new Map();
const kajwebDir=new URL('kajweb/json/',dataDir);
if(existsSync(kajwebDir)){
  const {readdir}=await import('node:fs/promises');
  for(const file of (await readdir(kajwebDir)).filter(name=>name.endsWith('.json')).sort()){
    const lines=(await readFile(new URL(file,kajwebDir),'utf8')).split('\n').filter(Boolean);
    for(const line of lines){
      let row;try{row=JSON.parse(line)}catch{continue}
      const word=String(row.headWord||'').toLowerCase();
      if(!word||examples.has(word))continue;
      const sentences=row.content?.word?.content?.sentence?.sentences||[];
      const pick=sentences.find(sentence=>{
        const text=String(sentence.sContent||'').trim();
        return text.length>=10&&text.length<=140&&text.split(/\s+/).length>=3&&text.split(/\s+/).length<=20;
      });
      if(pick?.sContent)examples.set(word,{ex:pick.sContent.trim(),exzh:String(pick.sCn||'').trim().slice(0,120)});
    }
  }
  console.log(`kajweb 例句命中：${examples.size}`);
}else console.log('提示：缺少 data-src/kajweb/json/，跳过例句');

// ---------- 4. CEFR-J Wordlist 1.6（ALL 表：A=单词 B=词性 C=等级） ----------
const cefrMap=new Map();
const levelRank={A1:1,A2:2,B1:3,B2:4,C1:5,C2:6};
const xlsxDir=new URL('cefrj/x/',dataDir);
if(existsSync(new URL('xl/sharedStrings.xml',xlsxDir))){
  const strings=(await readFile(new URL('xl/sharedStrings.xml',xlsxDir),'utf8')).match(/<si>[\s\S]*?<\/si>/g)?.map(tag=>tag.replace(/<[^>]+>/g,''))||[];
  // 通过 workbook.xml + rels 找到 ALL 表对应的 sheet 文件。
  const workbook=await readFile(new URL('xl/workbook.xml',xlsxDir),'utf8');
  const rels=await readFile(new URL('xl/_rels/workbook.xml.rels',xlsxDir),'utf8');
  const allSheet=/<sheet [^>]*name="ALL"[^>]*r:id="(rId\d+)"/.exec(workbook)?.[1];
  const target=allSheet?new RegExp(`Id="${allSheet}"[^>]*Target="([^"]+)"`).exec(rels)?.[1]:'worksheets/sheet2.xml';
  const sheetXml=await readFile(new URL(`xl/${target.replace(/^.*?worksheets\//,'worksheets/')}`,xlsxDir),'utf8');
  for(const rowXml of sheetXml.match(/<row [^>]*>[\s\S]*?<\/row>/g)||[]){
    const cells={};
    for(const match of rowXml.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)){
      let value=/<v>([^<]*)<\/v>/.exec(match[3])?.[1]??'';
      if(/t="s"/.test(match[2]))value=strings[Number(value)]??'';
      cells[match[1]]=value;
    }
    const word=(cells.A||'').toLowerCase();
    const level=cells.C||'';
    if(word&&levelRank[level]&&(!cefrMap.has(word)||levelRank[level]<levelRank[cefrMap.get(word)]))cefrMap.set(word,level);
  }
  console.log(`CEFR-J 词条：${cefrMap.size}`);
}else console.log('提示：缺少 data-src/cefrj/x/，跳过 CEFR 分级');

// ---------- 5. 三条学习路线的种子词表（人工整理，可继续补充） ----------
const TESTING_SEED='bug defect defectless test tested tester testing testcase testable regression requirement requirements assertion assertions assert verify verified verify validate validated validation verification scenario scenarios reproduce reproduced reproducible failure failures error errors issue issues report reported reporting severity priority priorities coverage automated automation automate manual manually performance security compatibility accessibility interface interfaces browser browsers release deployed deployment deploy environment environments staging production debug debugging debugger log logged logging mock mocked stub stubs fixture fixtures suite suites framework frameworks execution execute executed crash crashes crashed hang hangs freeze freezes workaround root cause ticket tickets sprint agile demo uat endpoint endpoints payload payloads request requests response responses status codes http json xml database databases sql query queries backend frontend unit integration smoke sanity exploratory traceability expected actual pass passed fail failed passing failing quality assurance checklist checklists walkthrough inspection inspectionre peer review reviews capture replay load stress usability install uninstall upgrade downgrade patch hotfix rollback milestone deliverable acceptance criteria functional nonfunctional';
const TECH_SEED='computer computers software hardware server servers client clients database databases data network networks internet website websites web application applications app apps program programs coding code algorithm algorithms model models prompt prompts agent agents artificial intelligence machine learning training train generated generation generate prediction predictions predict predictive system systems platform platforms cloud digital device devices privacy password passwords login logout account accounts input output update updates updated version versions interface api cache cached compute computing cpu gpu neural dataset datasets token tokens inference chatbot robots robotic binary compiler compilers debug encrypted encryption encrypt framework frameworks frontend backend function functions hardware install installed javascript json linux memory module modules object oriented parameter parameters pixel pixels process processes processor processors programming python query rendered renders rendering runtime script scripts syntax terminal terminals upload uploaded variable variables virtual virus viruses wireless desktop laptop keyboard screen display file files folder directory directories upload download bandwidth browser cache cookies domain hosting protocol protocols socket sockets thread threads concurrent concurrency asynchronous async distributed architecture repository repositories commit commits branch branches merge pipeline pipelines container containers docker kubernetes orchestration microservice microservices scalability scalable bandwidth storage';
const DAILY_SCENE='hello goodbye introduce conversation discuss explain invite accept refuse apologize appreciate congratulate promise remind recommend suggest message contact address neighbor family friend relationship hobby habit routine appointment schedule request reply question answer opinion experience event plan arrange participate attend';
const toWords=text=>new Set(text.split(/\s+/).filter(Boolean));
const TESTING_WORDS=toWords(TESTING_SEED),TECH_WORDS=toWords(TECH_SEED),DAILY_WORDS=toWords(DAILY_SCENE);

// ---------- 6. 组装新词库 ----------
const entries=[];
for(const base of baseEntries){
  const [w,ipa,zh,levels]=Array.isArray(base)?base:[base.w,base.ipa,base.zh,base.levels||[]];
  const dict=ecdict.get(w);
  const lemma=dict?.exchange?.match(/0:([^/\s]+)/)?.[1]?.toLowerCase();
  const isTesting=TESTING_WORDS.has(w),isTech=TECH_WORDS.has(w),isDaily=DAILY_WORDS.has(w);
  // ECDICT 各义项以字面 \n 分隔；软件测试/计算机词优先取计算机相关义项。
  const senses=String(dict?.definition||'').split(/\\n|\n|;;/).map(sense=>sense.trim()).filter(Boolean);
  const techSense=senses.find(sense=>/comput|program|software|system|machine|code|data|network|internet/i.test(sense));
  let def=(isTesting||isTech?techSense||senses[0]:senses[0])||'';
  if(def.length>140)def=def.slice(0,def.lastIndexOf(' ',140)>60?def.lastIndexOf(' ',140):140).trim();
  const example=examples.get(w);
  const cefr=cefrMap.get(w)||cefrMap.get(lemma||'')||'';
  const bnc=Number(dict?.bnc)||0,frq=Number(dict?.frq)||0;
  const tracks=[];
  if(isTesting)tracks.push('testing');
  if(isTech)tracks.push('ai');
  if(tracks.length===0&&(dict?.oxford==='1'||(bnc>0&&bnc<=1500)||(frq>0&&frq<=1500)||isDaily))tracks.push('daily');
  entries.push({w,ipa,zh:String(zh||dict?.translation||'').slice(0,130),def,ex:example?.ex||'',exzh:example?.exzh||'',levels,cefr,tracks});
}
const tracks={testing:entries.filter(entry=>entry.tracks.includes('testing')).length,ai:entries.filter(entry=>entry.tracks.includes('ai')).length,daily:entries.filter(entry=>entry.tracks.includes('daily')).length};
console.log(`路线分布：软件测试 ${tracks.testing} · 计算机/AI ${tracks.ai} · 日常 ${tracks.daily} · 未标注 ${entries.filter(entry=>!entry.tracks.length).length}`);
console.log(`CEFR 已标注：${entries.filter(entry=>entry.cefr).length} · 带英英释义：${entries.filter(entry=>entry.def).length} · 带例句：${entries.filter(entry=>entry.ex).length}`);
const output=`// English Lab 词库：WordTyper 词表 + ECDICT(MIT) 释义/词频 + kajweb 例句（仅本地使用）+ CEFR-J 1.6 分级。\n// 生成方式：node scripts/enrich-vocab.mjs；许可证见 LICENSES/ 与 docs/资源与数据源清单.md。\nconst VOCAB_LIBRARY=${JSON.stringify(entries)};\n`;
await writeFile(new URL('dist/vocab-data.js',root),output);
console.log(`已生成 dist/vocab-data.js（${(output.length/1024/1024).toFixed(2)} MB）`);
