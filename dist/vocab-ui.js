// 考试级别与使用场景是两条独立的筛选轴；四、六级标签仅供备考参考。
const vocabScenes={
  daily:{zh:'日常交流',en:'Daily life',words:'hello goodbye introduce conversation discuss explain invite accept refuse apologize appreciate congratulate promise remind recommend suggest message contact address neighbor family friend relationship hobby habit routine appointment schedule request reply question answer opinion experience event plan arrange participate attend'},
  campus:{zh:'校园学习',en:'Campus & study',words:'campus college university classroom lecture seminar professor tutor student graduate graduation degree diploma curriculum course subject chapter textbook library assignment homework project essay thesis research experiment laboratory academic scholarship semester examination exam quiz score grade revise review memorize vocabulary grammar pronunciation translation dictionary knowledge skill concentrate focus analyze compare evaluate summarize'},
  work:{zh:'职场沟通',en:'Workplace',words:'office colleague manager employee employer client customer meeting agenda deadline report proposal contract budget salary interview recruit position career profession department company business strategy negotiate cooperate coordinate communicate presentation document email attachment feedback performance task responsibility priority efficient schedule deliver approve confirm invoice receipt payment'},
  travel:{zh:'旅行出行',en:'Travel',words:'airport airline flight passport visa luggage baggage suitcase destination departure arrival journey trip travel tourist tourism hotel reservation booking accommodation reception transport transportation subway railway train station platform ticket route map direction traffic delay cancel transfer board gate customs border journey vehicle driver passenger fare'},
  shopping:{zh:'购物消费',en:'Shopping',words:'shop store market supermarket purchase buy sell price cost expense discount sale bargain refund return exchange receipt cashier cash card credit debit account product item brand quality quantity size color delivery order package parcel online payment customer service compare recommend choose afford budget consume consumption'},
  health:{zh:'健康医疗',en:'Health',words:'health healthy illness disease symptom fever headache cough pain injury medicine medical doctor nurse hospital clinic patient treatment therapy recover recovery exercise diet nutrition sleep rest stress anxiety appointment emergency infection virus vaccine prevention protect safety mental physical'},
  news:{zh:'社会与新闻',en:'Society & news',words:'news article headline journalist media report evidence source issue society community government policy economy economic environment climate energy pollution culture education population public citizen election law legal justice equality opportunity challenge consequence impact influence trend develop development change global local international'},
  writing:{zh:'学术写作',en:'Academic writing',words:'abstract argument assumption citation conclusion context contrast data definition demonstrate evidence factor hypothesis illustrate indicate interpret method objective outcome perspective principle process publish reference relevant research significant theory variable verify whereas furthermore nevertheless therefore consequently despite although'},
  testing:{zh:'软件测试',en:'Software testing',words:'bug defect test case regression testing requirement assertion test testing verify validate verification validation scenario expected actual reproduce failure error issue report severity priority coverage automation manual performance security compatibility accessibility interface browser release deploy'},
  technology:{zh:'计算机与 AI',en:'Computing & AI',words:'computer software hardware server client database data network internet website application program code algorithm model prompt agent artificial intelligence machine learning training generate prediction system platform cloud digital device privacy security password login account input output update version deploy interface'}
};
const vocabSceneMap=new Map();
for(const [scene,config] of Object.entries(vocabScenes))for(const name of config.words.split(' ')){
  const value=vocabSceneMap.get(name)||[];if(!value.includes(scene))value.push(scene);vocabSceneMap.set(name,value);
}
for(const item of WORDS){
  item.levels ||= VOCAB_LIBRARY.find(entry=>entry.w===item.w)?.levels||[];
  item.scenes=vocabSceneMap.get(item.w)||[];
  if(item.cat==='Software Testing'&&!item.scenes.includes('testing'))item.scenes.push('testing');
  if(item.cat==='Computer & AI'&&!item.scenes.includes('technology'))item.scenes.push('technology');
  if(item.cat==='Daily English'&&!item.scenes.includes('daily'))item.scenes.push('daily');
}
let vocabLevel='all',vocabScene='all',vocabSearch='',vocabPage=0,vocabReviewOnly=false;
const vocabPageSize=40;
const vocabText=(zh,en)=>uiLanguage==='zh'?zh:en;
function filteredVocabularyWords(){return WORDS.filter(item=>(vocabLevel==='all'||item.levels.includes(vocabLevel))&&(vocabScene==='all'||item.scenes.includes(vocabScene))&&(!vocabSearch||item.w.includes(vocabSearch)||item.zh.includes(vocabSearch))&&(!vocabReviewOnly||reviewIsDue(item.w,state.learned,state.reviews)))}
function selectedVocabularyWord(){return filteredVocabularyWords()[wordIndex]}
const vocabButton=(kind,value,label,active)=>`<button type="button" class="chip ${active?'active':''}" data-vocab-${kind}="${esc(value)}">${esc(label)}</button>`;
function wordsPage(){
  const filtered=filteredVocabularyWords();
  wordIndex=Math.max(0,Math.min(wordIndex,filtered.length-1));
  vocabPage=Math.floor(wordIndex/vocabPageSize);
  const item=filtered[wordIndex];
  const levels=[['all',vocabText('全部级别','All levels')],['CET4',vocabText('大学四级','CET-4')],['CET6',vocabText('大学六级','CET-6')]];
  const levelButtons=levels.map(([id,label])=>vocabButton('level',id,label,vocabLevel===id)).join('');
  const sceneButtons=[['all',vocabText('全部场景','All situations')],...Object.entries(vocabScenes).map(([id,scene])=>[id,vocabText(scene.zh,scene.en)])].map(([id,label])=>vocabButton('scene',id,label,vocabScene===id)).join('');
  const start=vocabPage*vocabPageSize,visible=filtered.slice(start,start+vocabPageSize);
  const sceneNames=item?.scenes.map(id=>vocabText(vocabScenes[id].zh,vocabScenes[id].en)).join(' · ')||vocabText('综合词汇','General vocabulary');
  const badges=item?[...item.levels,item.cefr,sceneNames].filter(Boolean).join(' · '):'';
  const detail=item?`<section class="card word-card"><p class="eyebrow">${esc(badges)} · ${wordIndex+1} / ${filtered.length}</p><h2>${esc(item.w)}</h2><div class="phonetic">${esc(item.ipa||'')}</div><div class="definition">${esc(item.def||item.zh)}</div>${item.def?`<div class="definition-zh-inline">${esc(item.zh)}</div>`:''}<div id="vocab-english" class="vocab-english"></div>${item.ex?`<div class="example"><b>${vocabText('例句','Example')}</b><br>${esc(item.ex)}</div>${item.exzh?`<div class="definition-zh-inline">${esc(item.exzh)}</div>`:''}`:''}<div class="action-row"><button class="secondary" data-speak="${esc(item.w)}">${vocabText('🔊 听发音','🔊 Listen')}</button><button class="secondary" id="learn">${state.learned.includes(item.w)?vocabText('✓ 已学','✓ Learned'):vocabText('标记已学','Mark learned')}</button></div><div class="eyebrow" style="margin:29px 0 10px">${vocabText('你记住了吗？','HOW WELL DO YOU REMEMBER?')}</div><div class="action-row">${[['again',vocabText('没记住','Again')],['hard',vocabText('有点难','Hard')],['good',vocabText('记住了','Good')],['easy',vocabText('很简单','Easy')]].map(([key,label])=>`<button class="chip" data-review="${key}">${label}</button>`).join('')}</div><p class="muted-text">${state.reviews[item.w]?vocabText('下次复习：','Next review: ')+new Date(state.reviews[item.w].due).toLocaleDateString(uiLanguage==='zh'?'zh-CN':'en-US'):vocabText('选择记忆情况，系统会安排下次复习。','Choose a rating to schedule a review.')}</p><button class="primary" id="next-word">${vocabText('下一个单词 →','Next word →')}</button></section>`:`<section class="card vocab-empty">${vocabReviewOnly?vocabText('当前没有到期单词。可以继续学习新词，或明天再来复习。','No words are due. Learn new words or come back tomorrow.'):vocabText('没有找到匹配的词。试试清除搜索或切换筛选条件。','No matching word. Clear the search or change the filters.')}</section>`;
  return `<div class="content">${head(vocabText('词汇学习','VOCABULARY'),vocabText('按级别和场景学单词','Words by level and situation'),vocabText('四、六级词汇与生活场景可组合筛选；原有学习记录继续保留。','Combine exam levels with real-life situations. Your progress is preserved.'),`<span class="pill">${WORDS.length} ${vocabText('个词条','words')}</span>`)}<section class="card vocab-filters"><div class="vocab-filter-label">${vocabText('考试级别','Exam level')}</div><div class="category-row">${levelButtons}</div><div class="vocab-filter-label">${vocabText('使用场景','Situation')}</div><div class="category-row">${sceneButtons}</div><div class="search-row"><input id="vocab-search" class="input" type="search" value="${esc(vocabSearch)}" placeholder="${vocabText('搜索英文或中文释义','Search a word or Chinese meaning')}" aria-label="${vocabText('搜索词库','Search vocabulary')}"><button id="vocab-search-button" class="secondary">${vocabText('搜索','Search')}</button>${vocabSearch?`<button id="vocab-clear" class="secondary">${vocabText('清除','Clear')}</button>`:''}</div><p class="muted-text">${vocabText('当前筛选','Matching words')}：${filtered.length} / ${WORDS.length} · ${vocabText('考试标签为备考参考，并非官方完整大纲。','Exam tags are study references, not an official syllabus.')}</p></section><div class="two-col">${detail}<aside class="card"><div class="mini-title"><h3>${vocabText('单词列表','Word list')}</h3><span>${filtered.length} ${vocabText('词','WORDS')}</span></div><div class="word-list">${visible.map((entry,index)=>`<button class="${start+index===wordIndex?'selected':''}" data-vocab-index="${start+index}"><b>${esc(entry.w)}</b><small>${state.learned.includes(entry.w)?vocabText('✓ 已学','✓ Learned'):esc(entry.zh.slice(0,16))}</small></button>`).join('')}</div><div class="vocab-pagination"><button class="secondary" data-vocab-page="previous" ${vocabPage===0?'disabled':''}>${vocabText('上一页','Previous')}</button><span>${filtered.length?`${vocabPage+1} / ${Math.ceil(filtered.length/vocabPageSize)}`:'0 / 0'}</span><button class="secondary" data-vocab-page="next" ${start+vocabPageSize>=filtered.length?'disabled':''}>${vocabText('下一页','Next')}</button></div></aside></div><p class="footer-note">${vocabText('词汇数据来自开放授权的 ECDICT 派生词表；详细英英释义按需从 Free Dictionary API 读取。','Vocabulary comes from an open ECDICT-derived list. Detailed English definitions load from Free Dictionary API when available.')}</p></div>`;
}
const originalProgressPage=progressPage;
progressPage=function(){
  const total=state.learned.length,reviewCount=state.events.filter(item=>item.type==='review').length,readCount=state.read.length;
  const groups=[['CET4',vocabText('大学四级','CET-4')],['CET6',vocabText('大学六级','CET-6')],...Object.entries(vocabScenes).map(([id,scene])=>[id,vocabText(scene.zh,scene.en)])];
  return `<div class="content">${head(vocabText('学习历程','YOUR JOURNEY'),vocabText('学习进度','Progress'),vocabText('按级别和场景查看已学词汇。','See your learned words by level and situation.'))}<div class="stat-grid" style="margin:0 0 20px"><div class="card stat"><strong>${total}</strong><small>${vocabText('已学单词','WORDS LEARNED')}</small></div><div class="card stat"><strong>${reviewCount}</strong><small>${vocabText('累计复习','TOTAL REVIEWS')}</small></div><div class="card stat"><strong>${readCount}</strong><small>${vocabText('已读短文','STORIES READ')}</small></div></div><section class="card"><div class="mini-title"><h3>${vocabText('各类词汇进度','Vocabulary progress')}</h3><span>${WORDS.length} ${vocabText('词条','WORDS')}</span></div><div class="vocab-progress-grid">${groups.map(([id,label])=>{const matches=WORDS.filter(item=>id.startsWith('CET')?item.levels.includes(id):item.scenes.includes(id)),learned=matches.filter(item=>state.learned.includes(item.w)).length;return `<div class="vocab-progress-item"><div><b>${esc(label)}</b><span>${learned} / ${matches.length}</span></div><div class="progress-line"><i style="width:${matches.length?learned/matches.length*100:0}%"></i></div></div>`}).join('')}</div></section></div>`;
};
const vocabDefinitions=new Map();
async function showVocabDefinition(name,targetId){
  const target=document.getElementById(targetId);if(!target||!name||!/^[a-z][a-z -]{0,44}$/.test(name))return;
  if(!vocabDefinitions.has(name)){
    target.textContent=vocabText('正在读取英英释义……','Loading English definition…');
    try{const response=await fetch(`/api/dictionary/${encodeURIComponent(name)}`);if(!response.ok)throw Error();vocabDefinitions.set(name,await response.json())}catch{vocabDefinitions.set(name,null)}
  }
  if(!target.isConnected||target.dataset.word!==name)return;
  const result=vocabDefinitions.get(name);
  target.innerHTML=result?.definition?`<b>${vocabText('英英释义','English definition')}</b><p>${esc(result.definition)}</p>${result.example?`<p><b>${vocabText('原词典例句','Dictionary example')}</b> ${esc(result.example)}</p>`:''}<small>Free Dictionary API</small>`:`<span>${vocabText('暂时无法读取英英释义，可点击下方外部词典继续查询。','English definition is unavailable. Try the external dictionaries below.')}</span>`;
}
const renderWithVocabulary=render;
render=function(){renderWithVocabulary();if(page==='words'){
  document.querySelector('.vocab-filters')?.insertAdjacentHTML('afterbegin',`<div class="category-row vocab-review-filter"><button type="button" class="chip ${vocabReviewOnly?'active':''}" data-vocab-due="toggle">${vocabText('到期复习','Due reviews')} · ${due()}</button><span>${vocabText('按记忆情况安排下次复习','Reviews are scheduled from your ratings')}</span></div>`);
  const item=selectedVocabularyWord(),target=document.getElementById('vocab-english');
  if(item&&target){
    target.dataset.word=item.w;
    target.insertAdjacentHTML('afterend',`<div class="vocab-dictionary-links"><button type="button" class="dict-study" data-vocab-dictionary="${esc(item.w)}">${vocabText('在站内词典查询 →','Open in site dictionary →')}</button></div>`);
    if(!item.def)showVocabDefinition(item.w,'vocab-english');
  }
}else if(page==='dictionary'&&query){
  const found=word(query.trim().toLowerCase());
  const definition=document.querySelector('.result .definition');
  if(found&&!found.def&&definition){definition.textContent=found.zh;document.querySelector('.result details')?.remove()}
  if(!found){const missing=document.querySelector('.result .muted-text');if(missing)missing.textContent=vocabText(`“${query}”暂不在当前词库中，可试试下方外部词典。`,`“${query}” is not in this library. Try an external dictionary below.`)}
}};
document.addEventListener('click',clickEvent=>{
  const button=clickEvent.target.closest('button');if(!button)return;
  if(button.dataset.vocabDictionary){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();query=button.dataset.vocabDictionary;navigate('dictionary');return}
  if(button.dataset.reviewOpen!==undefined){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();vocabReviewOnly=true;vocabLevel='all';vocabScene='all';vocabSearch='';wordIndex=0;navigate('words');return}
  const level=button.dataset.vocabLevel,scene=button.dataset.vocabScene,index=button.dataset.vocabIndex,direction=button.dataset.vocabPage,dueToggle=button.dataset.vocabDue;
  if(level!==undefined||scene!==undefined||index!==undefined||direction||dueToggle!==undefined||['vocab-search-button','vocab-clear','learn','next-word'].includes(button.id)||button.dataset.review){
    if(page!=='words')return;
    clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
    if(dueToggle!==undefined){vocabReviewOnly=!vocabReviewOnly;vocabLevel='all';vocabScene='all';vocabSearch='';wordIndex=0}
    else if(level!==undefined){vocabLevel=level;wordIndex=0}
    else if(scene!==undefined){vocabScene=scene;wordIndex=0}
    else if(index!==undefined)wordIndex=Number(index);
    else if(direction){wordIndex=Math.max(0,Math.min(filteredVocabularyWords().length-1,(vocabPage+(direction==='next'?1:-1))*vocabPageSize))}
    else if(button.id==='vocab-search-button'){vocabSearch=document.getElementById('vocab-search').value.trim().toLowerCase();wordIndex=0}
    else if(button.id==='vocab-clear'){vocabSearch='';wordIndex=0}
    else if(button.id==='learn'){const item=selectedVocabularyWord();if(item&&!state.learned.includes(item.w)){state.learned.push(item.w);state.reviews[item.w] ||= initialReview();event('learn',item.w);state.xp+=5;save();toast(vocabText('已加入已学单词 · +5 经验值','Added to learned words · +5 XP'))}}
    else if(button.dataset.review){const item=selectedVocabularyWord();if(item){if(!state.learned.includes(item.w))state.learned.push(item.w);state.reviews[item.w]=nextReview(state.reviews[item.w],button.dataset.review);event('review',{word:item.w,rating:button.dataset.review});save();if(!vocabReviewOnly)wordIndex=(wordIndex+1)%filteredVocabularyWords().length;else wordIndex=Math.min(wordIndex,Math.max(0,filteredVocabularyWords().length-1));toast(vocabText('已安排下次复习','Review scheduled'))}}
    else if(button.id==='next-word'&&filteredVocabularyWords().length)wordIndex=(wordIndex+1)%filteredVocabularyWords().length;
    render();return;
  }
},true);
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.id==='vocab-search'){event.preventDefault();vocabSearch=event.target.value.trim().toLowerCase();wordIndex=0;render()}},true);
