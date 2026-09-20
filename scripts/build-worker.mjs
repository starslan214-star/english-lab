// 将前端文件打包进单个 Worker，确保在线版与 API 同源。
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const files=['index.html','fsrs.js','review-core.js','app.js','vocab-data.js','vocab-ui.js','i18n.js','ai.js','news.js','dictionary-ui.js','ai-dictionary.js','notebook.js','settings.js','library.js','adaptive-game.js','style.css','i18n.css','news.css','vocab.css','dictionary.css','notebook.css','settings.css','library.css','adaptive-game.css','print.css','sw.js','manifest.webmanifest','icon.svg'];
const assets={};
for(const name of files)assets[name]=await readFile(new URL(`dist/${name}`,root),'utf8');
const handler=await readFile(new URL('worker/handler.mjs',root),'utf8');
const news=await readFile(new URL('worker/news.mjs',root),'utf8');
const dictionary=await readFile(new URL('worker/dictionary.mjs',root),'utf8');
const baidu=await readFile(new URL('worker/baidu.mjs',root),'utf8');
const md5Vendor=await readFile(new URL('worker/md5-vendor.js',root),'utf8');
const bundledNews=news.replace('export function parseGoogleFeed','function parseGoogleFeed').replace('export function parseSeleniumBlog','function parseSeleniumBlog').replace('export async function getNews','async function getNews');
const bundledDictionary=dictionary.replace('export async function getDictionaryDefinition','async function getDictionaryDefinition');
const bundledBaidu=baidu.replace('export async function translateBaidu','async function translateBaidu');
const bundledHandler=handler.replace("import {getNews} from './news.mjs';",'').replace("import {getDictionaryDefinition} from './dictionary.mjs';",'').replace("import {translateBaidu} from './baidu.mjs';",'').replace('export function createHandler','function createHandler');
const result=`const assets=${JSON.stringify(assets)};\nconst module={exports:{}};\n${md5Vendor}\nconst md5=module.exports;\n${bundledNews}\n${bundledDictionary}\n${bundledBaidu}\n${bundledHandler}\nexport default createHandler(assets);\n`;
await mkdir(new URL('dist/server/',root),{recursive:true});
await writeFile(new URL('dist/server/index.js',root),result);
