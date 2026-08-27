import re, json, os
base = r"C:\Users\15188\WorkBuddy\20260511183045\quant_interview"
idx = os.path.join(base, "index.html")
html = open(idx, encoding="utf-8").read()

m = re.search(r"const questions\s*=\s*\[(.*?)\n\];", html, re.S)
if not m:
    print("ARRAY NOT FOUND")
    raise SystemExit(1)
arr = m.group(1)

pat = re.compile(
    r"id:\s*(\d+),\s*"
    r"cat:\s*\"([^\"]*)\",\s*"
    r"diff:\s*(\d+),\s*"
    r"book:\s*\"([^\"]*)\",\s*"
    r"title:\s*\"((?:[^\"\\]|\\.)*)\",\s*"
    r"answer:\s*`([\s\S]*?)`,",
    re.S,
)

objs = []
for b in pat.finditer(arr):
    objs.append({
        "id": int(b.group(1)),
        "cat": b.group(2),
        "diff": int(b.group(3)),
        "book": b.group(4),
        "title": b.group(5),
        "answer": b.group(6),
    })

print("EXTRACTED:", len(objs))
ids = [o["id"] for o in objs]
print("ID RANGE:", min(ids), max(ids), "DUP:", len(ids) != len(set(ids)))
empty_ans = [o["id"] for o in objs if not o["answer"].strip()]
print("EMPTY ANSWER IDS COUNT:", len(empty_ans))
if empty_ans:
    print("EMPTY ANSWER IDS:", empty_ans[:40])

out = os.path.join(base, "questions_full.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=1)
print("WROTE", out, "chars", os.path.getsize(out))
