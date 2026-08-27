const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const objs = JSON.parse(fs.readFileSync(base + "questions_full.json", "utf8"));
const BATCH = 40;
let n = 0;
for (let i = 0; i < objs.length; i += BATCH) {
  const chunk = objs.slice(i, i + BATCH);
  fs.writeFileSync(base + `to_translate_v2_${String(n).padStart(2, '0')}.json`, JSON.stringify(chunk, null, 1));
  n++;
}
console.log("SPLIT INTO", n, "BATCHES of", BATCH, "total", objs.length);
// show first batch id range
const b0 = JSON.parse(fs.readFileSync(base + "to_translate_v2_00.json", "utf8"));
console.log("BATCH00 ids:", b0[0].id, "->", b0[b0.length - 1].id, "sample title:", b0[0].title);
const b15 = JSON.parse(fs.readFileSync(base + `to_translate_v2_${String(n - 1).padStart(2, '0')}.json`, "utf8"));
console.log("LASTBATCH ids:", b15[0].id, "->", b15[b15.length - 1].id);
