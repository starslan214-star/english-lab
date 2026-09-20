// 间隔复习核心：FSRS 算法（ts-fsrs v5，MIT，见 LICENSES/ts-fsrs-MIT.txt）。
// 记录同时保存 FSRS 字段（s/d/st/lr）和旧版字段（interval/ease/reps/lapses/rating），
// 旧格式记录在第一次评分或导入备份时自动迁移；fsrs.js 未加载时降级为简化算法。
const REVIEW_DAY=86400000,REVIEW_LEARN=10*60*1000;
const REVIEW_GRADES={again:1,hard:2,good:3,easy:4};
const reviewFsrs=(()=>{try{
  const library=globalThis.FSRS;
  const params=library.generatorParameters({request_retention:.9,maximum_interval:3650,enable_fuzz:false});
  return {engine:library.fsrs(params),State:library.State||{New:0,Learning:1,Review:2,Relearning:3}};
}catch{return {engine:null,State:{New:0,Learning:1,Review:2,Relearning:3}}}})();
function reviewLegacyNext(previous,rating,now=Date.now()){
  const oldDays=Math.max(0,Number(previous?.interval)||0);
  const oldEase=Math.min(3,Math.max(1.3,Number(previous?.ease)||2.5));
  const oldReps=Math.max(0,Number(previous?.reps)||0);
  const oldLapses=Math.max(0,Number(previous?.lapses)||0);
  let interval,ease=oldEase,reps=oldReps,lapses=oldLapses;
  if(rating==='again'){
    interval=0;ease=Math.max(1.3,ease-.2);reps=0;lapses++;
  }else if(rating==='hard'){
    interval=Math.max(1,Math.round((oldDays||1)*1.2));ease=Math.max(1.3,ease-.15);reps++;
  }else if(rating==='easy'){
    interval=Math.max(oldDays+1,Math.round((oldDays||1)*(ease+.7)));ease=Math.min(3,ease+.15);reps++;
  }else{
    interval=Math.max(1,Math.round((oldDays||1)*ease));reps++;
  }
  return {interval,ease,reps,lapses,rating,due:now+(rating==='again'?REVIEW_LEARN:interval*REVIEW_DAY),updatedAt:now};
}
// 把任意旧版/部分记录转换为统一格式；新词（无有效复习历史）保持 s=0。
function migrateReviewRecord(previous,now=Date.now()){
  const clean={interval:Math.max(0,Number(previous?.interval)||0),ease:Math.min(3,Math.max(1.3,Number(previous?.ease)||2.5)),reps:Math.max(0,Number(previous?.reps)||0),lapses:Math.max(0,Number(previous?.lapses)||0),rating:String(previous?.rating||'new'),due:Number(previous?.due)||now+REVIEW_DAY,updatedAt:Number(previous?.updatedAt)||now};
  const hasHistory=clean.reps>0&&clean.rating!=='new';
  if(!Number.isFinite(previous?.s)||!hasHistory){
    return {...clean,s:hasHistory?Math.min(3650,Math.max(.4,clean.interval||.4)):0,d:Math.min(10,Math.max(1,10-(clean.ease-1.3)*3.3)),st:hasHistory?reviewFsrs.State.Review:reviewFsrs.State.New,lr:hasHistory?Math.min(Number(previous?.updatedAt)||now,now):null};
  }
  return {...clean,s:Math.min(3650,Math.max(.1,Number(previous.s))),d:Math.min(10,Math.max(1,Number(previous.d)||5)),st:Number.isFinite(previous.st)?Number(previous.st):reviewFsrs.State.Review,lr:Number.isFinite(previous.lr)?previous.lr:null};
}
function reviewRecordFromCard(card,rating,now){
  const interval=card.scheduled_days||0;
  return {interval,ease:Math.round((10-card.difficulty)/3.3*100+1.3*100)/100,reps:card.reps,lapses:card.lapses,rating,s:Math.round(card.stability*1000)/1000,d:Math.round(card.difficulty*1000)/1000,st:card.state,lr:now,due:card.due.getTime(),updatedAt:now};
}
function initialReview(now=Date.now()){
  return {interval:1,ease:2.5,reps:0,lapses:0,rating:'new',s:0,d:0,st:reviewFsrs.State.New,lr:null,due:now+REVIEW_DAY,updatedAt:now};
}
// previous 可以是旧格式或新格式；rating 取 again/hard/good/easy。
function nextReview(previous,rating,now=Date.now()){
  const grade=REVIEW_GRADES[rating];
  if(!grade)return nextReview(previous,'good',now);
  const legacyFallback=()=>{
    const legacy=reviewLegacyNext(previous,rating,now);
    const normalized=migrateReviewRecord(legacy,now);
    return {...legacy,s:normalized.s,d:normalized.d,st:normalized.st,lr:normalized.lr};
  };
  if(!reviewFsrs.engine)return legacyFallback();
  try{
    const record=migrateReviewRecord(previous,now);
    const isNew=record.st===reviewFsrs.State.New||!record.s;
    const card=isNew
      ?globalThis.FSRS.createEmptyCard(new Date(now))
      :{due:new Date(Math.min(Number(previous?.due)||now,now+REVIEW_LEARN)),stability:record.s,difficulty:record.d,elapsed_days:Math.max(0,Math.floor((now-(record.lr||now))/REVIEW_DAY)),scheduled_days:record.interval,reps:record.reps,lapses:record.lapses,state:record.st,last_review:record.lr?new Date(record.lr):undefined};
    const {card:next}=reviewFsrs.engine.next(card,grade,new Date(now));
    if(!next||!Number.isFinite(next.stability))return legacyFallback();
    return reviewRecordFromCard(next,rating,now);
  }catch{return legacyFallback()}
}
function reviewIsDue(name,learned,reviews,now=Date.now()){
  if(!learned.includes(name)&&!reviews[name])return false;
  const record=reviews[name];
  return !record||!Number.isFinite(Number(record.due))||Number(record.due)<=now;
}
