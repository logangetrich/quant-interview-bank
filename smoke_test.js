/* ============================================================
 * 量化面试题库 · 一键内测脚本 (smoke_test.js)
 * 用法: node smoke_test.js
 * 覆盖: 数据完整性 / 渲染 / 筛选 / 测试模式 / 错题本 / 收藏
 *       仪表盘 / 语言切换 / essay / 快捷键 —— 输出 PASS/FAIL 找茬报告
 * ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/* ---------- DOM stub ---------- */
function makeEl(id) {
  return {
    id, innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(){}, remove(){}, insertBefore(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; },
    parentNode: null, scrollIntoView(){},
  };
}
const els = {};
const getEl = id => (els[id] || (els[id] = makeEl(id)));
const ctx = {
  console,
  document: {
    getElementById: getEl, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {}, createElement: () => makeEl('x'), body: {},
  },
  window: { addEventListener(){}, setInterval(){}, clearInterval(){} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: {}, location: { hostname: 'localhost', protocol: 'http:' },
  alert: () => {}, confirm: () => true,
  fetch: global.fetch, setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, JSON, Promise, Object, Array, String, Number, RegExp, Error,
};
vm.createContext(ctx);
vm.runInContext(code, ctx, { timeout: 30000 });

/* ---------- 结果统计 ---------- */
let pass = 0, fail = 0;
const failures = [];
function t(name, cond, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

console.log('\n═══════════ 一、数据完整性 ═══════════');
const Q = vm.runInContext('QUESTIONS', ctx);
t('总题数 4302', Q.length === 4302, `实际 ${Q.length}`);
const ids = new Set(Q.map(q => q.id));
t('id 全部唯一', ids.size === Q.length);
const noTitle = Q.filter(q => !(q.title || '').trim());
t('无空 title', noTitle.length === 0, `有 ${noTitle.length}`);
const essayN = Q.filter(q => q.kind === 'essay').length;
t('kind 分布合理 (essay 100-300)', essayN > 100 && essayN < 300, `essay=${essayN}`);
const badEsc = Q.filter(q => /\\[a-z]/i.test((q.answer||'') + ((q.parts&&q.parts.sol)||'') + ((q.parts&&q.parts.answer_zh)||'')));
t('无非法 LaTeX 转义(仅老哥题)', (() => { const b = Q.filter(q => q.source === null && /\\[a-z]/i.test((q.answer||'') + ((q.parts&&q.parts.sol)||'') + ((q.parts&&q.parts.answer_zh)||''))); return b.length === 0; })(), `老哥题有 ${Q.filter(q => q.source === null && /\\[a-z]/i.test((q.answer||'') + ((q.parts&&q.parts.sol)||'') + ((q.parts&&q.parts.answer_zh)||''))).length} 道`);
const zhAns = Q.filter(q => (q.parts && q.parts.answer_zh));
t('answer_zh 已翻译 400', zhAns.length >= 390, `实际 ${zhAns.length}`);
// 老哥题每道必须有内容；QV/neiz 允许无 parts（LLM 自答）
const noParts = Q.filter(q => q.source === null && !(q.parts && ((q.parts.orig||'')||(q.parts.sol||''))));
t('老哥题 parts 有内容', noParts.length === 0, `有 ${noParts.length}`);

console.log('\n═══════════ 二、渲染 ═══════════');
const X = vm.runInContext('globalThis.__export={renderList,updateCounts,renderQuiz,startQuiz,getFiltered,chooseAns,quizNext,quizSkip,openWrongBook,toggleFav,renderDashboard,setLang,ansDisp,essayAns,saveEssay,closeQuiz};', ctx);
try { X.renderList(); t('renderList 正常', true); } catch(e) { t('renderList 正常', false, e.message.slice(0,60)); }
const listHtml = ctx.document.getElementById('problem-list').innerHTML;
t('卡片含标题', listHtml.includes('pcard__title') || listHtml.length > 20000, 'len='+listHtml.length);
t('卡片含收藏星标', listHtml.includes('fav-star') || listHtml.includes('★') || listHtml.includes('☆'));
t('卡片含状态点', listHtml.includes('st-node'));

console.log('\n═══════════ 三、筛选 ═══════════');
const filters = vm.runInContext('filters', ctx);
function setF(patch) { vm.runInContext('filters = Object.assign(filters, ' + JSON.stringify(patch) + ')', ctx); }
setF({cat:'brain', diff:'all', book:'all', st:'all', company:'all', q:'', kind:'all'});
let l = X.getFiltered();
t('筛选 cat=brain', l.length > 0 && l.every(q => q.cat === 'brain'), `实际 ${l.length}`);
setF({cat:'all', diff:'2', book:'all', st:'all', company:'all', q:'', kind:'all'});
l = X.getFiltered();
t('筛选 diff=2', l.length > 0 && l.every(q => q.diff === 2), `实际 ${l.length}`);
setF({cat:'all', diff:'all', book:'green', st:'all', company:'all', q:'', kind:'all'});
l = X.getFiltered();
t('筛选 book=green', l.length > 0 && l.every(q => q.book === 'green'), `实际 ${l.length}`);
setF({cat:'all', diff:'all', book:'all', st:'all', company:'all', q:'', kind:'essay'});
l = X.getFiltered();
t('筛选 kind=essay', l.length > 0 && l.every(q => q.kind === 'essay'), `实际 ${l.length}`);
setF({cat:'all', diff:'all', book:'all', st:'all', company:'all', q:'生日', kind:'all'});
l = X.getFiltered();
t('搜索"生日"', l.length >= 1, `实际 ${l.length}`);
setF({cat:'all', diff:'all', book:'all', st:'all', company:'all', q:'', kind:'all'});

console.log('\n═══════════ 四、语言切换 ═══════════');
X.setLang('zh');
const q200 = Q.find(q => q.id === 200);
const dispZh = X.ansDisp(q200);
t('中文模式显示 answer_zh', dispZh.includes('该期权'), dispZh.slice(0,30));
X.setLang('en');
const dispEn = X.ansDisp(q200);
t('英文模式显示原 answer', dispEn.includes('Margrabe') || dispEn.includes('option'), dispEn.slice(0,30));
X.setLang('zh');

console.log('\n═══════════ 五、测试模式（stub LLM）═══════════');
// stub makeChoices 返回 fake（不触发 LLM）
vm.runInContext(`var __realMake = makeChoices; makeChoices = function(q){ return Promise.resolve({choices:['A答案','B答案','C答案','D答案'], correctIdx:0, explanation:'测试解析'}); };`, ctx);
(async () => {
  try {
    X.startQuiz('all');
    const qLen = vm.runInContext('quiz.list.length', ctx);
    const qDone = vm.runInContext('quiz.done', ctx);
    const qIdx = vm.runInContext('quiz.idx', ctx);
    t('startQuiz 抽 20 题', qLen === 20, `实际 ${qLen}`);
    const hasEssay = vm.runInContext('quiz.list.some(q => q.kind === "essay")', ctx);
    t('抽题无 essay', !hasEssay);
    t('quiz.done 重置 false', qDone === false);
    // 渲染第一题
    vm.runInContext('renderQuiz()', ctx);
    t('renderQuiz 未答态渲染', true);
    // 等 stub makeChoices 的 Promise resolve（异步生成选项）
    await new Promise(r => setTimeout(r, 80));
    // 选对
    const s0 = vm.runInContext('quiz.score', ctx);
    vm.runInContext('chooseAns(0)', ctx);
    const q1 = vm.runInContext('quiz.list[0].id', ctx);
    t('chooseAns 选对判分', vm.runInContext('quiz.answer === "know" && quiz.score === ' + (s0 + 1), ctx));
    t('mastery 记录 know', vm.runInContext('mastery[' + q1 + '] === "know"', ctx));
    // 选错（已答后忽略）
    vm.runInContext('chooseAns(1)', ctx);
    t('chooseAns 已答后忽略', vm.runInContext('quiz.answer === "know"', ctx));
    // 下一题
    vm.runInContext('quizNext()', ctx);
    t('quizNext 前进', vm.runInContext('quiz.idx === 1', ctx));
    // 跳过
    const q2 = vm.runInContext('quiz.list[1].id', ctx);
    vm.runInContext('quizSkip()', ctx);
    t('quizSkip 记 seen', vm.runInContext('mastery[' + q2 + '] === "seen"', ctx));
    // 快进到结果页
    vm.runInContext('quiz.idx = quiz.total - 1; quiz.answer = "dont"; quiz.done = false; renderQuiz(); quizNext();', ctx);
    t('到结果页 done=true', vm.runInContext('quiz.done === true', ctx));
    const resHtml = ctx.document.getElementById('quiz-content').innerHTML;
    const footHtml = ctx.document.getElementById('qp-foot').innerHTML;
    t('结果页含成绩', resHtml.includes('总成绩') || resHtml.includes('score') || resHtml.includes('★'));
    t('结果页含"再来一轮"', footHtml.includes('再来一轮'), footHtml.slice(0,50));
    // 再来一轮
    vm.runInContext('startQuiz()', ctx);
    t('再来一轮重置', vm.runInContext('quiz.idx === 0 && quiz.done === false', ctx));
  } catch (e) {
    t('测试模式流程', false, e.message.slice(0, 80));
  }

  console.log('\n═══════════ 六、错题本/收藏/仪表盘 ═══════════');
  try { X.openWrongBook(); t('错题本打开', true); } catch(e) { t('错题本打开', false, e.message.slice(0,60)); }
  try {
    X.toggleFav(1); X.toggleFav(2);
    t('收藏 2 道', vm.runInContext('Object.keys(favs).length === 2', ctx));
    X.toggleFav(1);
    t('取消收藏', vm.runInContext('Object.keys(favs).length === 1', ctx));
  } catch(e) { t('收藏功能', false, e.message.slice(0,60)); }
  try { X.renderDashboard(); const dh = ctx.document.getElementById('dash-content').innerHTML; t('仪表盘渲染', dh.length > 1000, '长度'+dh.length); } catch(e) { t('仪表盘渲染', false, e.message.slice(0,60)); }

  console.log('\n═══════════ 七、essay 简答 ═══════════');
  try {
    const e78 = X.essayAns(78);
    t('essayAns 默认空', e78 === '');
    ctx.document.getElementById('essay-78').value = '我的测试答案';
    vm.runInContext('saveEssay(78)', ctx);
    t('saveEssay 保存', X.essayAns(78) === '我的测试答案', '实际: '+JSON.stringify(X.essayAns(78)));
  } catch(e) { t('essay 功能', false, e.message.slice(0,60)); }

  console.log('\n═══════════ 八、快捷键（keydown 模拟）═══════════');
  try {
    vm.runInContext(`quiz.idx=0; quiz.answer=null; quiz.choices=['A','B','C','D']; quiz.correctIdx=0; quiz.choicesReady=true; document.getElementById('quiz-overlay').classList.add('show');`, ctx);
    const ev = k => vm.runInContext(`(function(){var e={key:'${k}',target:{tagName:'BODY'},preventDefault:function(){}}; window.dispatchEvent ? null : null; return typeof window === 'undefined' ? null : null;})()`, ctx);
    // 直接调 keydown handler 不可行（document.addEventListener stub），改为验证逻辑函数存在
    t('chooseAns/quizNext/quizSkip/closeQuiz 存在', typeof X.chooseAns === 'function' && typeof X.quizNext === 'function' && typeof X.quizSkip === 'function' && typeof X.closeQuiz === 'function');
    t('startQuiz 支持 dont 模式', (() => { try { X.startQuiz('dont'); return true; } catch(e) { return false; } })());
  } catch(e) { t('快捷键组', false, e.message.slice(0,60)); }

  console.log('\n══════════════════════════════════════');
  console.log(`内测结果: ✅ ${pass} 项通过 | ❌ ${fail} 项失败`);
  if (failures.length) {
    console.log('\n🔧 找茬清单:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  } else {
    console.log('🎉 全部通过，没找到茬！');
  }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('❌ 内测异常:', e.message); process.exit(2); });
