const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const html = fs.readFileSync(base + "index.html", "utf8");
const m = html.match(/const questions\s*=\s*\[([\s\S]*)\n\];/);
const arr = m[1];

function test(name, re) {
  const r = arr.match(re);
  console.log(name, "=>", r ? r.length : 0, r ? "SAMPLE: " + JSON.stringify(r[0].slice(0, 120)) : "");
}
test("A id+cat", /id:\s*\d+,\s*cat:\s*"[^"]*"/g);
test("B +diff+book", /id:\s*\d+,\s*cat:\s*"[^"]*",\s*diff:\s*\d+,\s*book:\s*"[^"]*"/g);
test("C +title", /id:\s*\d+,\s*cat:\s*"[^"]*",\s*diff:\s*\d+,\s*book:\s*"[^"]*",\s*title:\s*"[^"]*"/g);
test("D +title-escaped", /id:\s*\d+,\s*cat:\s*"[^"]*",\s*diff:\s*\d+,\s*book:\s*"[^"]*",\s*title:\s*"((?:[^"\\]|\\.)*)"/g);
test("E full", /id:\s*\d+,\s*cat:\s*"[^"]*",\s*diff:\s*\d+,\s*book:\s*"[^"]*",\s*title:\s*"((?:[^"\\]|\\.)*)",\s*answer:\s*`([\s\S]*?)`/g);

// inspect a tricky title: find any title containing a backslash or quote
const titleMatches = arr.match(/title:\s*"[^"]*"/g) || [];
console.log("TITLE COUNT:", titleMatches.length);
const weird = titleMatches.filter(t => /title:\s*"[^"]*["\\]/.test(t));
console.log("WEIRD TITLES (should be 0):", weird.length);
// show first title exactly
console.log("FIRST TITLE RAW:", JSON.stringify(titleMatches[0]));
