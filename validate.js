const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const full = JSON.parse(fs.readFileSync(base + "questions_full.json", "utf8"));
const fullIds = new Set(full.map(o => o.id));
const files = fs.readdirSync(base).filter(f => f.startsWith("trans_v2_") && f.endsWith(".json")).sort();
let allOk = true;
for (const fn of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(base + fn, "utf8")); }
  catch (e) { console.log(fn, "PARSE ERROR:", e.message); allOk = false; continue; }
  const emptyAns = data.filter(o => !o.answer || !o.answer.trim()).length;
  const emptyTit = data.filter(o => !o.title || !o.title.trim()).length;
  const ansCn = data.reduce((s, o) => s + (o.answer || "").replace(/[^\u4e00-\u9fa5]/g, "").length, 0);
  const ansTot = data.reduce((s, o) => s + (o.answer || "").length, 0);
  const ratio = ansTot ? (ansCn / ansTot).toFixed(2) : "0";
  const badIds = data.filter(o => !fullIds.has(o.id)).map(o => o.id);
  const status = (emptyAns === 0 && emptyTit === 0 && badIds.length === 0) ? "OK" : "BAD";
  if (status === "BAD") allOk = false;
  console.log(`${fn}: n=${data.length} emptyAns=${emptyAns} emptyTit=${emptyTit} cnRatio=${ratio} badIds=${badIds.length} => ${status}`);
}
console.log(allOk ? "ALL BATCHES OK" : "SOME BATCHES BAD -- NEED FIX");
