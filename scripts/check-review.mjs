// 验证复习核心：FSRS 调度、旧记录迁移与降级兜底的关键规则。
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const loadCore=async withFsrs=>{
  const context=vm.createContext({console,Date,Math,Number,JSON,Object,Map,Set});
  if(withFsrs)vm.runInContext(await readFile(new URL('../dist/fsrs.js',import.meta.url),'utf8'),context);
  vm.runInContext(await readFile(new URL('../dist/review-core.js',import.meta.url),'utf8')+';globalThis.api={nextReview,initialReview,reviewIsDue,migrateReviewRecord}',context);
  return context.api;
};
const now=1_700_000_000_000;
const DAY=86400000;

for(const [label,withFsrs] of [['FSRS 引擎',true],['降级算法',false]]){
  const {nextReview,initialReview,reviewIsDue,migrateReviewRecord}=await loadCore(withFsrs);
  // 新卡
  const first=initialReview(now);
  assert.equal(first.due,now+DAY);
  assert.equal(reviewIsDue('ability',['ability'],{},now),true);
  assert.equal(reviewIsDue('ability',['ability'],{ability:first},now),false);
  // 评分链：间隔总体递增，due 单调前进
  let card=first,previousDue=0;
  for(const rating of ['good','good','easy','good']){
    card=nextReview(card,rating,now);
    assert.ok(card.due>previousDue,`${label}: due 应递增`);
    assert.ok(card.due>now,`${label}: 到期时间应在未来`);
    assert.ok(Number.isFinite(card.s)&&Number.isFinite(card.d),`${label}: FSRS 字段应写入`);
    previousDue=card.due;
  }
  // again：回到短期复习并记一次 lapse
  const before={...card};
  const again=nextReview(card,'again',now);
  assert.equal(again.lapses,before.lapses+1);
  assert.ok(again.due<=now+DAY,`${label}: again 应安排短期内复习`);
  // 旧格式记录自动迁移：保留到期时间，补齐 FSRS 字段
  const legacy={interval:6,ease:2.5,reps:3,lapses:1,rating:'good',due:now+3*DAY,updatedAt:now-2*DAY};
  const migrated=migrateReviewRecord(legacy);
  assert.equal(migrated.due,legacy.due,'迁移不应改变到期时间');
  assert.ok(migrated.s>0&&migrated.st===2,`${label}: 旧记录应迁移为 Review 状态`);
  const next=nextReview(legacy,'good',now);
  assert.ok(next.due>now,`${label}: 迁移后评分应产生未来到期`);
  // 迁移幂等
  assert.deepEqual(migrateReviewRecord(migrated),migrated);
  console.log(`复习算法检查通过（${label}）`);
}
console.log('全部复习检查通过');
