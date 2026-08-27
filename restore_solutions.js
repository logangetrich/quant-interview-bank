// restore_solutions.js
// 对 72 道 trans_v2 中"参考解答"段被损坏的题，从 questions_full.json 拿英文"参考解答"段
// 写回 trans_v2 / index.html
const fs=require('fs');
const path=require('path');

const files=fs.readdirSync('.').filter(f=>/^trans_v2_\d+\.json$/.test(f));
const qf = JSON.parse(fs.readFileSync('questions_full.json','utf8'));
const qfMap={};
for(const x of qf) qfMap[x.id]=x;

// 函数: 抽出 questions_full.json 里的"参考解答"段
function extractSolution(ans){
  const m = ans.match(/<strong>\s*参考解答[：:]?\s*<\/strong>([\s\S]*?)(?=<div class="answer-hint"|$)/);
  if(!m) return '';
  let body = m[1].trim();
  // 去掉段尾页码/章节号（通常 "40 2. OPTION PRICING" 之类）
  body = body.replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'');
  body = body.replace(/\n{3,}/g,'\n\n').trim();
  return body;
}

const damaged=[];
for(const f of files){
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  for(const q of d){
    const a=q.answer||'';
    if(a.match(/<strong>\s*原题/) && !a.match(/<strong>\s*参考解答|<strong>\s*解答/)){
      const en = qfMap[q.id];
      if(en){
        const sol = extractSolution(en.answer||'');
        if(sol){
          // 把英文参考解答段加到 answer 末尾
          const wrapped = q.answer +
            `<br/><br/><div style="margin-top:12px;padding:10px 14px;background:rgba(88,166,255,0.06);border-left:3px solid var(--accent-blue);border-radius:6px"><strong>📖 参考解答（英文原文）</strong><br/><br/>` +
            sol.replace(/\n/g,'<br/>') +
            `</div>`;
          q.answer = wrapped;
          damaged.push({id:q.id,file:f});
        }
      }
    }
  }
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
}
console.log('恢复参考解答数:', damaged.length);
for(const x of damaged) console.log(x.id, x.file);

// 重新生成 index.html
const txMap={};
for(const f of files){
  const d=JSON.parse(fs.readFileSync(f,'utf8'));
  for(const q of d) if(q.id!=null) txMap[q.id]=q;
}
const idToMeta={};
for(const x of qf){ idToMeta[x.id]={cat:x.cat,diff:x.diff,book:x.book}; }
const items=[];
for(const idStr of Object.keys(txMap)){
  const id=+idStr;
  const q=txMap[id];
  const m=idToMeta[id]||{cat:'other',diff:1,book:'other'};
  items.push({id,cat:m.cat,diff:m.diff,book:m.book,title:q.title,answer:q.answer});
}
items.sort((a,b)=>a.id-b.id);
function escAns(s){return (s||'').replace(/[\\`]/g,m=>'\\'+m).replace(/\$\{/g,'\\${');}
function jsStr(s){return '`'+escAns(s)+'`';}

const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('const questions = ');
let depth=0, end=-1, inT=false, bd=0, i=start+'const questions = '.length;
while(i<html.length){
  const c=html[i];
  if(inT){
    if(c==='\\'){i+=2;continue;}
    if(c==='$'&&html[i+1]==='{'){bd=1;i+=2;while(i<html.length&&bd>0){const d=html[i];if(d==='\\'){i+=2;continue;}if(d==='{')bd++;else if(d==='}')bd--;i++;}continue;}
    if(c==='`'){inT=false;i++;continue;}
    i++;continue;
  }
  if(c==='`'){inT=true;i++;continue;}
  if(c==='"'||c==="'"){const q=c;i++;while(i<html.length&&html[i]!==q){if(html[i]==='\\')i+=2;else i++;}i++;continue;}
  if(c==='/'&&html[i+1]==='/'){while(i<html.length&&html[i]!=='\n')i++;continue;}
  if(c==='[')depth++;
  if(c===']'){depth--;if(depth===0){end=i+1;break;}}
  i++;
}
const before=html.substring(0, start+'const questions = '.length);
const after=html.substring(end);
let arrText='[\n';
for(let k=0;k<items.length;k++){
  const x=items[k];
  arrText += `  {\n    id: ${x.id}, cat: "${x.cat}", diff: ${x.diff}, book: "${x.book}",\n    title: ${JSON.stringify(x.title)},\n    answer: ${jsStr(x.answer)},\n  }` + (k<items.length-1?',':'') + '\n';
}
arrText += '];';
fs.writeFileSync('index.html', before+arrText+after);
console.log('index.html 写回完成. 长度:', (before+arrText+after).length);
