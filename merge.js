const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const full = JSON.parse(fs.readFileSync(base + "questions_full.json", "utf8"));
full.sort((a, b) => a.id - b.id);
const trans = {};
const files = fs.readdirSync(base).filter(f => f.startsWith("trans_v2_") && f.endsWith(".json")).sort();
for (const fn of files) {
  const data = JSON.parse(fs.readFileSync(base + fn, "utf8"));
  for (const o of data) trans[o.id] = o;
}
const bad = full.filter(o => !trans[o.id] || !trans[o.id].answer || !trans[o.id].answer.trim());
if (bad.length) { console.log("MISSING/BAD IDS:", bad.map(o => o.id)); process.exit(1); }

function escTitle(s) { return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }
function escAns(s) { return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$"); }

const blocks = full.map(o => {
  const t = trans[o.id];
  let b = `  {\n    id: ${o.id}, cat: "${o.cat}", diff: ${o.diff}, book: "${o.book}",\n`;
  b += `    title: "${escTitle(t.title)}",\n`;
  b += `    answer: \`${escAns(t.answer)}\`,\n  },`;
  return b;
});
const arr = "const questions = [\n" + blocks.join("\n") + "\n];\n";

const idx = base + "index.html";
const html = fs.readFileSync(idx, "utf8");
const m = html.match(/const questions\s*=\s*\[([\s\S]*)\n\];/);
if (!m) { console.log("ARRAY NOT FOUND IN index.html"); process.exit(1); }
const newHtml = html.slice(0, m.index) + arr + html.slice(m.index + m[0].length);
fs.writeFileSync(idx, newHtml, "utf8");
console.log("MERGED", full.length, "questions into index.html; new array bytes:", arr.length);
