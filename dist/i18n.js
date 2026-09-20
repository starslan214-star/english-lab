// 界面默认使用中文；英文学习材料保留原文，并按需显示中文辅助。
const uiLanguageKey = 'english-lab-language';
let uiLanguage = localStorage.getItem(uiLanguageKey) === 'en' ? 'en' : 'zh';
const uiTranslations = new Map(Object.entries({
  'FOR SOFTWARE TESTERS':'软件测试学习者',
  'YOUR PERSONAL ENGLISH WORKSPACE':'你的英语学习工作台',
  'YOUR LEARNING PATH':'你的学习路线',
  'Build the basics':'打好基础',
  'Read with confidence':'逐渐读懂英文',
  'A little each day helps you read real technical English.':'每天一点，逐渐读懂真实的技术英语。',
  'Today':'今日学习',
  'Words':'单词',
  'Reading':'阅读',
  'Word Game':'单词游戏',
  'Dictionary':'词典',
  'Learning Log':'学习日志',
  'Progress':'学习进度',
  'TODAY, YOUR LEARNING SPACE':'今天的学习',
  'Good to see you.':'你好，开始今天的学习吧。',
  'A short session today makes tomorrow easier.':'每天学一点，明天就会更轻松。',
  'YOUR NEXT STEP':'下一步',
  'Learn English through real testing stories.':'通过软件测试情境学习英语。',
  'Start with a simple word, hear it, then use it in context. 中文解释只在需要时显示。':'先看单词、听发音，再到句子中理解。可以随时切换中英文。',
  'Start learning →':'开始学习 →',
  'NEW WORDS TODAY':'今日新词',
  'REVIEWS TODAY':'今日复习',
  'READINGS TODAY':'今日阅读',
  'Read something short':'读一篇短文',
  'A small bug, a useful test':'一个小缺陷，一次有用的测试',
  'A two minute story about a tester, a login button, and a useful test case.':'用两分钟读懂测试员、登录按钮和测试用例的故事。',
  'Open reading →':'开始阅读 →',
  'Today’s learning path':'今日学习任务',
  'Review 5 words':'复习 5 个单词',
  'Learn 5 new words':'学习 5 个新词',
  'Read one short story':'阅读 1 篇短文',
  'Open':'打开',
  'Keep in mind':'学习提示',
  'ENGLISH FIRST':'先看英文',
  'Read the simple English meaning and example first. Reveal Chinese only when you need it.':'先试着读简明英文解释和例句；需要时再看中文。',
  'VOCABULARY':'词汇学习',
  'Words in context':'在句子中记单词',
  'English meaning first. Learn daily life, testing, and AI words.':'涵盖日常生活、软件测试与 AI 常用词。',
  'All':'全部',
  'Daily English':'日常英语',
  'Software Testing':'软件测试',
  'Computer & AI':'计算机与 AI',
  'DAILY ENGLISH':'日常英语',
  'SOFTWARE TESTING':'软件测试',
  'COMPUTER & AI':'计算机与 AI',
  'Example':'例句',
  '🔊 Listen':'🔊 听发音',
  'Show Chinese':'显示中文',
  'Hide Chinese':'隐藏中文',
  'Mark learned':'标记已学',
  '✓ Learned':'✓ 已学',
  'HOW WELL DO YOU REMEMBER?':'你记住了吗？',
  'Again':'没记住',
  'Hard':'有点难',
  'Good':'记住了',
  'Easy':'很简单',
  'Choose a review rating to schedule this word.':'选择记忆情况，系统会安排下次复习。',
  'Next word →':'下一个单词 →',
  'Word list':'单词列表',
  'Study':'学习',
  'READING ROOM':'分级阅读',
  'Short reads, real context':'读短文，学真实表达',
  'Tap an underlined word for a simple definition.':'点击带下划线的单词，可查看解释。',
  'Mark as read':'标记已读',
  '✓ Read again':'✓ 再读一遍',
  'Print / Save PDF':'打印／保存 PDF',
  'Check your understanding':'阅读理解',
  'What does Mia find?':'Mia 发现了什么？',
  'What tells the AI what you need?':'什么能告诉 AI 你的需求？',
  'When is Leo’s appointment?':'Leo 的预约在什么时候？',
  'A. A ticket':'A. 一张票',
  'B. A bug':'B. 一个程序缺陷',
  'C. A server':'C. 一台服务器',
  'A. A prompt':'A. 一条提示词',
  'B. A receipt':'B. 一张收据',
  'C. A ticket':'C. 一张票',
  'A. On Monday':'A. 星期一',
  'B. On Friday':'B. 星期五',
  'C. On Sunday':'C. 星期日',
  'Choose one answer.':'请选择一个答案。',
  'Correct! +10 XP':'答对了！获得 10 经验值',
  'Try again. Read the story once more.':'再试一次，可以回头读读短文。',
  'Key words':'重点单词',
  'ADD TO WORDS':'点击查看',
  'View →':'查看 →',
  'AI helps with everyday work':'AI 如何帮助日常工作',
  'An appointment on Friday':'星期五的预约',
  'WORD GAME':'单词游戏',
  'Bug Hunter':'找出程序缺陷',
  'Choose the word that fits each situation.':'根据情境，选出最合适的单词。',
  'The login button does not work. What did you find?':'登录按钮无法使用。你发现了什么？',
  'You check software again after a change. This is…':'软件修改后你重新检查它。这叫作……',
  'A set of steps to check the login page is a…':'用于检查登录页的一组步骤叫作……',
  'You give an AI assistant an instruction. It is a…':'你给 AI 助手一条指令。这叫作……',
  'Your team makes a new app version available. You…':'团队上线了新版应用。你们进行了……',
  'Read the situation, then choose an answer.':'阅读情境，然后选择答案。',
  'Correct! +10 XP ✨':'答对了！获得 10 经验值 ✨',
  'Not quite. Read the situation and try again.':'还不对，再读一遍情境后重试。',
  'Next challenge →':'下一题 →',
  'YOUR SCORE':'你的得分',
  'Correct answers earn 10 XP. The words also appear in the vocabulary section for later review.':'答对一题获得 10 经验值。相关单词可在词汇页复习。',
  'LOOK IT UP':'查词',
  'Search words in your learning library.':'在学习词库中搜索单词。',
  'Search':'搜索',
  'IN YOUR WORD LIBRARY':'词库中的解释',
  'Add to my words':'加入我的单词',
  'More dictionaries':'更多词典',
  'YOUR STUDY RECORD':'学习记录',
  'Your activity becomes an Obsidian-friendly Markdown note.':'学习记录可以下载为适合 Obsidian 的 Markdown 笔记。',
  'AUTO-GENERATED':'自动生成',
  'Download Markdown':'下载 Markdown',
  'Copy text':'复制内容',
  'HOW THIS WORKS':'记录方式',
  'Words you mark learned, reviews you rate, and stories you finish appear here automatically. Download the file and place it in your Obsidian vault.':'已学单词、复习评分和已读短文会自动出现在日志里。下载后可放入 Obsidian 笔记库。',
  'Study data is stored in this browser. Export regularly if you want a separate copy.':'学习数据保存在当前浏览器。建议定期导出日志备份。',
  'YOUR JOURNEY':'学习历程',
  'A clear view of what you have practiced.':'看看已经完成了多少学习。',
  'WORDS LEARNED':'已学单词',
  'TOTAL REVIEWS':'累计复习',
  'STORIES READ':'已读短文',
  'Vocabulary by topic':'各主题词汇进度',
  'NEXT STEP':'下一步',
  'Keep your routine small.':'每天学一点就好。',
  'Review a few due words, learn five new ones, then read a short story. A consistent routine builds confidence.':'复习几个到期单词，学习五个新词，再读一篇短文。保持规律最重要。',
  'Go to Today →':'返回今日学习 →',
  'Added to your learned words · +5 XP':'已加入已学单词 · +5 经验值',
  'Review scheduled':'已安排下次复习',
  'Reading added to today’s log':'已加入今日学习日志',
  'Copied to clipboard':'已复制到剪贴板',
  'Copy failed':'复制失败'
}));
const paragraphTranslations={
  'Mia is a software tester. She opens a login page. She types her email and password. The login button does not work. Mia finds a bug.':'Mia 是一名软件测试员。她打开登录页，输入邮箱和密码。登录按钮没有反应。Mia 发现了一个程序缺陷。',
  'Mia writes a test case. She tells the developer about the problem. The developer fixes it. Mia tests the page again. Now the button works.':'Mia 编写了一个测试用例，并把问题告诉开发人员。开发人员修复后，Mia 再次测试页面。现在按钮可以用了。',
  'An AI assistant can help with many tasks. You can write a prompt. The prompt tells the AI what you need. A clear prompt helps the AI give a useful answer.':'AI 助手能帮助完成许多任务。你可以写一条提示词，告诉 AI 你需要什么。清楚的提示词有助于得到有用的回答。',
  'A tester can ask an AI agent to suggest test cases. The tester still checks the answer. People make the final decision.':'测试员可以让 AI 智能体建议测试用例，但仍要自己检查答案。最终由人来决定。',
  'Leo has a doctor’s appointment on Friday. He checks his schedule. The appointment is at ten in the morning.':'Leo 星期五预约了医生。他查看日程，预约时间是上午十点。',
  'Leo takes the bus. He buys a ticket and arrives early. After the visit, he keeps the receipt.':'Leo 坐公交车，买了票并提前到达。看诊后，他保留了收据。'
};
const staticTextNodes=[];
for(const root of document.querySelectorAll('.brand,.side-bottom,.crumb')){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode()))staticTextNodes.push([node,node.nodeValue]);
}
function translateText(text){
  const trimmed=text.trim();
  if(!trimmed)return text;
  let translated=uiTranslations.get(trimmed);
  if(!translated){
    let match=trimmed.match(/^(\d+) \/ 3 COMPLETE$/);if(match)translated=`已完成 ${match[1]} / 3`;
    match=trimmed.match(/^(\d+) \/ (\d+) done · (\d+) due now$/);if(match)translated=`已完成 ${match[1]} / ${match[2]} · ${match[3]} 个待复习`;
    match=trimmed.match(/^(\d+) \/ (\d+) done$/);if(match)translated=`已完成 ${match[1]} / ${match[2]}`;
    match=trimmed.match(/^Review (\d+) words$/);if(match)translated=`复习 ${match[1]} 个单词`;
    match=trimmed.match(/^Learn (\d+) new words$/);if(match)translated=`学习 ${match[1]} 个新词`;
    match=trimmed.match(/^🔥 (\d+)-DAY STREAK$/);if(match)translated=`🔥 连续学习 ${match[1]} 天`;
    match=trimmed.match(/^✦ (\d+) XP EARNED$/);if(match)translated=`✦ 已获得 ${match[1]} 经验值`;
    match=trimmed.match(/^(\d+) DUE FOR REVIEW$/);if(match)translated=`${match[1]} 个待复习`;
    match=trimmed.match(/^(\d+) WORDS$/);if(match)translated=`${match[1]} 个单词`;
    match=trimmed.match(/^(\d+) STARTER WORDS$/);if(match)translated=`入门词库共 ${match[1]} 个单词`;
    match=trimmed.match(/^Next review: (.+)$/);if(match)translated=`下次复习：${match[1]}`;
    match=trimmed.match(/^LEVEL 1 · (.+)$/);if(match)translated=`第 1 关 · ${match[1]}`;
    match=trimmed.match(/^SCENARIO (\d+)$/);if(match)translated=`情境 ${match[1]}`;
    match=trimmed.match(/^(A1 · \d+) MIN READ$/);if(match)translated=`${match[1]} 分钟阅读`;
    match=trimmed.match(/^(DAILY ENGLISH|SOFTWARE TESTING|COMPUTER & AI) · (.+)$/);if(match)translated=`${uiTranslations.get(match[1])} · ${match[2]}`;
    match=trimmed.match(/^(.+) · (\d+) min$/);if(match)translated=`${match[1]} · ${match[2]} 分钟`;
  }
  return translated?text.replace(trimmed,translated):text;
}
function localizePage(){
  for(const [node,original] of staticTextNodes)node.nodeValue=original;
  document.documentElement.lang=uiLanguage==='zh'?'zh-CN':'en';
  document.title=`English Lab · ${uiLanguage==='zh'?(uiTranslations.get(NAV.find(item=>item[0]===page)?.[2])||'今日学习'):(NAV.find(item=>item[0]===page)?.[2]||'Today')}`;
  const toggle=document.getElementById('language-toggle');
  toggle.textContent=uiLanguage==='zh'?'中文 ▾':'English ▾';
  toggle.setAttribute('aria-label',uiLanguage==='zh'?'切换为英文界面':'Switch to Chinese interface');
  document.getElementById('date').textContent=new Date().toLocaleDateString(uiLanguage==='zh'?'zh-CN':'en-US',{year:'numeric',month:'short',day:'numeric'});
  if(uiLanguage==='en')return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode())){
    if(node.parentElement?.closest('pre,script,style,#language-toggle'))continue;
    const result=translateText(node.nodeValue);if(result!==node.nodeValue)node.nodeValue=result;
  }
  const input=document.getElementById('lookup-input');if(input){input.placeholder='试试搜索“regression testing”或“prompt”';input.setAttribute('aria-label','搜索单词')}
  // 词汇页自行显示中英文资料，避免筛选后出现另一个词的释义。
  if(page==='dictionary'){
    const found=word(query.trim().toLowerCase());
    const definition=document.querySelector('.result .definition');
    if(found&&definition)definition.insertAdjacentHTML('beforeend',`<span class="definition-zh">${esc(found.zh)}</span>`);
    document.querySelector('.result details')?.remove();
    const missing=document.querySelector('.result .muted-text');
    if(!found&&missing)missing.textContent=`“${query}”暂不在入门词库中，可以使用下方外部词典继续查询。`;
  }
  if(page==='reading'){
    const article=ARTICLES.find(item=>item.id===articleId);
    document.querySelectorAll('.reading-body p').forEach((p,index)=>{
      const translation=paragraphTranslations[article?.paragraphs[index]];
      if(translation)p.insertAdjacentHTML('afterend',`<p class="reading-zh">${esc(translation)}</p>`);
    });
  }
}
const languageButton=document.createElement('button');
languageButton.id='language-toggle';languageButton.type='button';languageButton.className='language-toggle';
document.querySelector('.top-actions').insertBefore(languageButton,document.getElementById('date'));
languageButton.addEventListener('click',()=>{
  uiLanguage=uiLanguage==='zh'?'en':'zh';localStorage.setItem(uiLanguageKey,uiLanguage);
  render();
});
const originalRender=render;
render=function(){originalRender();localizePage()};
localizePage();
new MutationObserver(()=>{
  if(uiLanguage!=='zh')return;
  const toastElement=document.getElementById('toast');
  const translated=translateText(toastElement.textContent);
  if(translated!==toastElement.textContent)toastElement.textContent=translated;
}).observe(document.getElementById('toast'),{childList:true,characterData:true,subtree:true});
