// 自适应单词游戏：按考试、场景和复习状态出题，并把选择题与拼写题写入 FSRS 复习记录。
let adaptiveGameMode='meaning';
let adaptiveGameQuestion=null;
let adaptiveGameAnswered=false;
let adaptiveGameStreak=0;
let adaptiveSelectedAnswer=null;

const adaptiveText=(zh,en)=>uiLanguage==='zh'?zh:en;
const adaptiveHash=value=>[...value].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,2166136261);

function adaptiveGamePool(){
  const pool=WORDS.filter(item=>(vocabLevel==='all'||item.levels.includes(vocabLevel))&&(vocabScene==='all'||item.scenes.includes(vocabScene))&&item.zh?.trim());
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
  const question=adaptiveGameQuestion&&pool.some(item=>item.w===adaptiveGameQuestion.target.w)?adaptiveGameQuestion:adaptiveNewQuestion();
  const levelOptions=[['all',adaptiveText('全部级别','All levels')],['CET4',adaptiveText('大学四级','CET-4')],['CET6',adaptiveText('大学六级','CET-6')]];
  const sceneOptions=[['all',adaptiveText('全部场景','All situations')],...Object.entries(vocabScenes).map(([id,item])=>[id,adaptiveText(item.zh,item.en)])];
  const modes=[['meaning',adaptiveText('英选中','English → Chinese')],['reverse',adaptiveText('中选英','Chinese → English')],['listening',adaptiveText('听音选词','Listen & choose')],['spelling',adaptiveText('拼写','Spelling')]];
  const filters=`<section class="card adaptive-game-filters"><label>${adaptiveText('考试级别','Exam level')}<select id="game-level" class="input">${levelOptions.map(([id,label])=>`<option value="${id}" ${vocabLevel===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label>${adaptiveText('使用场景','Situation')}<select id="game-scene" class="input">${sceneOptions.map(([id,label])=>`<option value="${id}" ${vocabScene===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><div><span>${adaptiveText('题型','Mode')}</span><div class="category-row">${modes.map(([id,label])=>`<button class="chip ${adaptiveGameMode===id?'active':''}" data-game-mode="${id}">${label}</button>`).join('')}</div></div><p>${adaptiveText('优先练习到期词和已学词；不足四个时从所选词库补充。','Due and learned words come first. The selected library fills the rest.')} · ${pool.length} ${adaptiveText('个可用词','available words')}</p></section>`;
  if(!question)return `<div class="content">${head(adaptiveText('自适应练习','ADAPTIVE GAME'),adaptiveText('词汇挑战','Vocabulary challenge'),adaptiveText('根据你的词库和复习记录动态出题。','Questions follow your library and review history.'))}${filters}<section class="card vocab-empty">${adaptiveText('当前筛选不足四个词，请扩大级别或场景范围。','This filter has fewer than four words. Choose a wider library.')}</section></div>`;
  const spelling=adaptiveGameMode==='spelling',listening=adaptiveGameMode==='listening';
  const prompt=adaptiveGameMode==='meaning'?`${adaptiveText('选择正确的中文意思','Choose the correct meaning')}: ${question.target.w}`:spelling?`${adaptiveText('根据释义拼写英文单词','Spell the English word')}: ${question.target.zh}`:listening?adaptiveText('听发音，选择你听到的单词','Listen and choose the word you hear'):`${adaptiveText('选择对应的英文单词','Choose the matching English word')}: ${question.target.zh}`;
  const answerArea=spelling?`<form id="adaptive-spelling-form" class="adaptive-spelling"><label for="adaptive-spelling-input">${adaptiveText('输入英文单词','Type the English word')}</label><div class="search-row"><input id="adaptive-spelling-input" class="input" autocomplete="off" autocapitalize="none" spellcheck="false" ${adaptiveGameAnswered?'disabled':''} value="${adaptiveSelectedAnswer===null?'':esc(String(adaptiveSelectedAnswer))}"><button class="primary" type="submit" ${adaptiveGameAnswered?'disabled':''}>${adaptiveText('提交','Check')}</button></div></form>`:`<div class="game-answer">${question.options.map((item,index)=>{const label=adaptiveGameMode==='meaning'?item.zh:item.w;const stateClass=adaptiveGameAnswered?(index===question.correct?'correct':buttonAnswerClass(index)):'';return `<button data-adaptive-answer="${index}" class="${stateClass}" ${adaptiveGameAnswered?'disabled':''}>${String.fromCharCode(65+index)}. ${esc(label)}</button>`}).join('')}</div>`;
  const targetWord=(spelling||listening)&&!adaptiveGameAnswered?'•'.repeat(Math.min(12,question.target.w.length)):question.target.w;
  const defaultNotice=adaptiveText(spelling?'输入后按回车提交，系统会自动安排复习。':listening?'可以重复播放发音，再选择答案。':'选择答案后，系统会自动更新该词的复习时间。',spelling?'Type your answer and press Enter to update the review schedule.':listening?'Replay the pronunciation as needed, then choose.':'Choose an answer to update this word’s review schedule.');
  return `<div class="content">${head(adaptiveText('自适应练习','ADAPTIVE GAME'),adaptiveText('词汇挑战','Vocabulary challenge'),adaptiveText('题目来自你选择的考试和场景词库。','Questions come from your selected exam and situation library.'),`<span class="pill">🔥 ${adaptiveGameStreak} ${adaptiveText('连对','streak')}</span>`)}${filters}<div class="two-col"><section class="card adaptive-game-card"><div class="eyebrow">${adaptiveText('第','QUESTION ')} ${gameIndex+1} ${adaptiveText('题','')}</div><h2>${esc(prompt)}</h2><button class="game-listen secondary" data-speak="${esc(question.target.w)}">🔊 ${adaptiveText('听发音','Listen')}</button>${answerArea}<p class="notice">${gameFeedback||defaultNotice}</p><button class="primary" id="adaptive-next" ${adaptiveGameAnswered?'':'disabled'}>${adaptiveText('下一题 →','Next question →')}</button></section><aside class="card"><div class="eyebrow">${adaptiveText('本题单词','TARGET WORD')}</div><div class="score adaptive-word">${esc(targetWord)}</div><p class="muted-text">${adaptiveGameAnswered?`${esc(question.target.ipa||'')}<br>${esc(question.target.zh)}`:adaptiveText('答题后显示音标和释义。','The pronunciation and meaning appear after you answer.')}</p><div class="eyebrow adaptive-score-label">${adaptiveText('总经验值','TOTAL XP')}</div><div class="score">${state.xp} <span>XP</span></div></aside></div></div>`;
}

function buttonAnswerClass(index){return adaptiveSelectedAnswer===index?'wrong':''}

function recordAdaptiveResult(correct){
  const question=adaptiveGameQuestion,rating=correct?'good':'again',reward=['spelling','listening'].includes(adaptiveGameMode)?15:10;
  if(!state.learned.includes(question.target.w)){state.learned.push(question.target.w);event('learn',question.target.w)}
  state.reviews[question.target.w]=nextReview(state.reviews[question.target.w],rating);
  event('review',{word:question.target.w,rating,source:'game'});event('game',{word:question.target.w,correct,mode:adaptiveGameMode});
  if(correct){state.xp+=reward;adaptiveGameStreak++;gameFeedback=adaptiveText(`答对了！已安排复习 · +${reward} XP`,`Correct! Review scheduled · +${reward} XP`)}
  else{const correctLabel=adaptiveGameMode==='meaning'?question.options[question.correct].zh:question.target.w;adaptiveGameStreak=0;gameFeedback=adaptiveText(`正确答案是 ${correctLabel}。已加入近期复习。`,`The answer is ${correctLabel}. Added to near-term review.`)}
  adaptiveGameAnswered=true;save();render();
}

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
    const answer=Number(button.dataset.adaptiveAnswer);adaptiveSelectedAnswer=answer;recordAdaptiveResult(answer===adaptiveGameQuestion.correct);return;
  }
  if(button.id==='adaptive-next'){clickEvent.preventDefault();clickEvent.stopImmediatePropagation();gameIndex++;adaptiveNewQuestion();render()}
},true);

document.addEventListener('submit',submitEvent=>{
  if(submitEvent.target.id!=='adaptive-spelling-form'||page!=='game'||adaptiveGameAnswered)return;
  submitEvent.preventDefault();submitEvent.stopImmediatePropagation();
  const input=$('#adaptive-spelling-input'),answer=input.value.trim();if(!answer){input.focus();return}
  adaptiveSelectedAnswer=answer;recordAdaptiveResult(answer.toLocaleLowerCase('en')===adaptiveGameQuestion.target.w.toLocaleLowerCase('en'));
},true);

render();
