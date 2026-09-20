// 自适应单词游戏：从考试级别、使用场景和到期复习词中动态出题，并写入 FSRS 复习记录。
let adaptiveGameMode='meaning';
let adaptiveGameQuestion=null;
let adaptiveGameAnswered=false;
let adaptiveGameStreak=0;
let adaptiveSelectedAnswer=null;

const adaptiveText=(zh,en)=>uiLanguage==='zh'?zh:en;
const adaptiveHash=value=>[...value].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,2166136261);

function adaptiveGamePool(){
  let pool=WORDS.filter(item=>(vocabLevel==='all'||item.levels.includes(vocabLevel))&&(vocabScene==='all'||item.scenes.includes(vocabScene))&&item.zh?.trim());
  const dueWords=pool.filter(item=>reviewIsDue(item.w,state.learned,state.reviews));
  const learnedWords=pool.filter(item=>state.learned.includes(item.w));
  if(dueWords.length>=4)return dueWords;
  if(learnedWords.length>=4)return [...dueWords,...learnedWords.filter(item=>!dueWords.includes(item))];
  return pool;
}

function adaptiveNewQuestion(){
  const pool=adaptiveGamePool();
  if(pool.length<4){adaptiveGameQuestion=null;return null}
  const seed=`${gameIndex}:${adaptiveGameMode}:${vocabLevel}:${vocabScene}`;
  const target=pool[adaptiveHash(seed)%pool.length];
  const distractors=pool.filter(item=>item.w!==target.w).sort((a,b)=>adaptiveHash(seed+a.w)-adaptiveHash(seed+b.w)).slice(0,3);
  const options=[target,...distractors].sort((a,b)=>adaptiveHash(seed+'option'+a.w)-adaptiveHash(seed+'option'+b.w));
  adaptiveGameQuestion={target,options,correct:options.findIndex(item=>item.w===target.w)};
  adaptiveGameAnswered=false;adaptiveSelectedAnswer=null;gameFeedback='';
  return adaptiveGameQuestion;
}

function adaptiveGamePage(){
  const pool=adaptiveGamePool();
  const question=adaptiveGameQuestion&&adaptiveGamePool().some(item=>item.w===adaptiveGameQuestion.target.w)?adaptiveGameQuestion:adaptiveNewQuestion();
  const levelOptions=[['all',adaptiveText('全部级别','All levels')],['CET4',adaptiveText('大学四级','CET-4')],['CET6',adaptiveText('大学六级','CET-6')]];
  const sceneOptions=[['all',adaptiveText('全部场景','All situations')],...Object.entries(vocabScenes).map(([id,item])=>[id,adaptiveText(item.zh,item.en)])];
  const filters=`<section class="card adaptive-game-filters"><label>${adaptiveText('考试级别','Exam level')}<select id="game-level" class="input">${levelOptions.map(([id,label])=>`<option value="${id}" ${vocabLevel===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label>${adaptiveText('使用场景','Situation')}<select id="game-scene" class="input">${sceneOptions.map(([id,label])=>`<option value="${id}" ${vocabScene===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><div><span>${adaptiveText('题型','Mode')}</span><div class="category-row"><button class="chip ${adaptiveGameMode==='meaning'?'active':''}" data-game-mode="meaning">${adaptiveText('英选中','English → Chinese')}</button><button class="chip ${adaptiveGameMode==='reverse'?'active':''}" data-game-mode="reverse">${adaptiveText('中选英','Chinese → English')}</button></div></div><p>${adaptiveText('优先练习到期词和已学词；不足四个时从所选词库补充。','Due and learned words come first. The selected library fills the rest.')} · ${pool.length} ${adaptiveText('个可用词','available words')}</p></section>`;
  if(!question)return `<div class="content">${head(adaptiveText('自适应练习','ADAPTIVE GAME'),adaptiveText('词汇挑战','Vocabulary challenge'),adaptiveText('根据你的词库和复习记录动态出题。','Questions follow your library and review history.'))}${filters}<section class="card vocab-empty">${adaptiveText('当前筛选不足四个词，请扩大级别或场景范围。','This filter has fewer than four words. Choose a wider library.')}</section></div>`;
  const prompt=adaptiveGameMode==='meaning'?`${adaptiveText('选择正确的中文意思','Choose the correct meaning')}: ${question.target.w}`:`${adaptiveText('选择对应的英文单词','Choose the matching English word')}: ${question.target.zh}`;
  return `<div class="content">${head(adaptiveText('自适应练习','ADAPTIVE GAME'),adaptiveText('词汇挑战','Vocabulary challenge'),adaptiveText('题目来自你选择的考试和场景词库。','Questions come from your selected exam and situation library.'),`<span class="pill">🔥 ${adaptiveGameStreak} ${adaptiveText('连对','streak')}</span>`)}${filters}<div class="two-col"><section class="card adaptive-game-card"><div class="eyebrow">${adaptiveText('第','QUESTION ')} ${gameIndex+1} ${adaptiveText('题','')}</div><h2>${esc(prompt)}</h2><button class="game-listen secondary" data-speak="${esc(question.target.w)}">🔊 ${adaptiveText('听发音','Listen')}</button><div class="game-answer">${question.options.map((item,index)=>{const label=adaptiveGameMode==='meaning'?item.zh:item.w;const stateClass=adaptiveGameAnswered?(index===question.correct?'correct':buttonAnswerClass(index)):'';return `<button data-adaptive-answer="${index}" class="${stateClass}" ${adaptiveGameAnswered?'disabled':''}>${String.fromCharCode(65+index)}. ${esc(label)}</button>`}).join('')}</div><p class="notice">${gameFeedback||adaptiveText('选择答案后，系统会自动更新该词的复习时间。','Choose an answer to update this word’s review schedule.')}</p><button class="primary" id="adaptive-next" ${adaptiveGameAnswered?'':'disabled'}>${adaptiveText('下一题 →','Next question →')}</button></section><aside class="card"><div class="eyebrow">${adaptiveText('本题单词','TARGET WORD')}</div><div class="score adaptive-word">${esc(question.target.w)}</div><p class="muted-text">${adaptiveGameAnswered?`${esc(question.target.ipa||'')}<br>${esc(question.target.zh)}`:adaptiveText('答题后显示音标和释义。','The pronunciation and meaning appear after you answer.')}</p><div class="eyebrow adaptive-score-label">${adaptiveText('总经验值','TOTAL XP')}</div><div class="score">${state.xp} <span>XP</span></div></aside></div></div>`;
}

function buttonAnswerClass(index){return adaptiveSelectedAnswer===index?'wrong':''}

const renderBeforeAdaptiveGame=render;
render=function(){renderBeforeAdaptiveGame();if(page==='game'){$('#app').innerHTML=adaptiveGamePage();localizePage()}};

document.addEventListener('change',changeEvent=>{
  if(page!=='game')return;
  if(changeEvent.target.id==='game-level'){vocabLevel=changeEvent.target.value;gameIndex=0;adaptiveGameQuestion=null;render()}
  if(changeEvent.target.id==='game-scene'){vocabScene=changeEvent.target.value;gameIndex=0;adaptiveGameQuestion=null;render()}
},true);

document.addEventListener('click',clickEvent=>{
  const button=clickEvent.target.closest('button');if(!button||page!=='game')return;
  if(button.dataset.gameMode){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();adaptiveGameMode=button.dataset.gameMode;gameIndex=0;adaptiveGameQuestion=null;render();return}
  if(button.dataset.adaptiveAnswer!==undefined&&!adaptiveGameAnswered){
    clickEvent.preventDefault();clickEvent.stopImmediatePropagation();
    const answer=Number(button.dataset.adaptiveAnswer),question=adaptiveGameQuestion,correct=answer===question.correct,rating=correct?'good':'again';adaptiveSelectedAnswer=answer;
    if(!state.learned.includes(question.target.w)){state.learned.push(question.target.w);event('learn',question.target.w)}
    state.reviews[question.target.w]=nextReview(state.reviews[question.target.w],rating);
    event('review',{word:question.target.w,rating,source:'game'});event('game',{word:question.target.w,correct});
    if(correct){state.xp+=10;adaptiveGameStreak++;gameFeedback=adaptiveText('答对了！已按“记住了”安排复习 · +10 XP','Correct! Scheduled as “Good” · +10 XP')}
    else{const correctLabel=adaptiveGameMode==='meaning'?question.options[question.correct].zh:question.options[question.correct].w;adaptiveGameStreak=0;gameFeedback=adaptiveText(`正确答案是 ${correctLabel}。已加入近期复习。`,`The answer is ${correctLabel}. Added to near-term review.`)}
    adaptiveGameAnswered=true;save();render();return;
  }
  if(button.id==='adaptive-next'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();gameIndex++;adaptiveNewQuestion();render()}
},true);

render();
