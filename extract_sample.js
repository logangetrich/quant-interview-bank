const fs = require('fs');
const base = "C:\\Users\\15188\\WorkBuddy\\20260511183045\\quant_interview\\";
const html = fs.readFileSync(base + "index.html", "utf8");
const idx = html.indexOf("const questions");
console.log("ARRAY IDX:", idx);
const snippet = html.slice(idx, idx + 1500);
console.log("=== SNIPPET ===");
console.log(snippet);
console.log("=== END ===");
// count backticks and occurrences of "id:"
console.log("count 'id:' :", (html.match(/id:/g) || []).length);
console.log("count backtick:", (html.match(/`/g) || []).length);
console.log("count 'answer:' :", (html.match(/answer:/g) || []).length);
console.log("count 'title:' :", (html.match(/title:/g) || []).length);
