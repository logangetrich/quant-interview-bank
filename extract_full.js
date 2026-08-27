const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const html = fs.readFileSync(base + "index.html", "utf8");
const m = html.match(/const questions\s*=\s*\[([\s\S]*)\n\];/);
if (!m) { console.log("NO ARRAY FOUND"); process.exit(1); }
const arr = m[1];
// answer closes as `...` }   (backtick, optional ws, closing brace)
const re = /id:\s*(\d+),\s*cat:\s*"([^"]*)",\s*diff:\s*(\d+),\s*book:\s*"([^"]*)",\s*title:\s*"((?:[^"\\]|\\.)*)",\s*answer:\s*`([\s\S]*?)`\s*}/g;
let objs = [], mm;
while ((mm = re.exec(arr))) {
  objs.push({ id: +mm[1], cat: mm[2], diff: +mm[3], book: mm[4], title: mm[5], answer: mm[6] });
}
console.log("EXTRACTED", objs.length);
const ids = objs.map(o => o.id);
console.log("ID RANGE", Math.min(...ids), Math.max(...ids), "DUP", ids.length !== new Set(ids).size);
const empty = objs.filter(o => !o.answer.trim()).map(o => o.id);
console.log("EMPTY ANS", empty.length, empty.slice(0, 30));
if (empty.length) {
  console.log("SAMPLE EMPTY OBJ:", JSON.stringify(objs.find(o => o.id === empty[0])));
}
const totalAnsChars = objs.reduce((s, o) => s + o.answer.length, 0);
const totalTitleChars = objs.reduce((s, o) => s + o.title.length, 0);
console.log("TOTAL ANSWER CHARS", totalAnsChars, "TOTAL TITLE CHARS", totalTitleChars);
fs.writeFileSync(base + "questions_full.json", JSON.stringify(objs, null, 1));
console.log("WROTE questions_full.json", fs.statSync(base + "questions_full.json").size, "bytes");
