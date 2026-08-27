import re, json
from collections import Counter

IDX = r"C:\Users\15188\WorkBuddy\20260511183045\quant_interview\index.html"
with open(IDX, encoding="utf-8") as f:
    html = f.read()

m = re.search(r"const questions\s*=\s*\[(.*?)\n\];", html, re.S)
arr = m.group(1)

# split objects by "  id: N," boundaries
parts = re.split(r"\n(\s*)id:\s*(\d+),", arr)
objs = []
for i in range(1, len(parts), 3):
    qid = int(parts[i+1])
    body = parts[i+2]
    cat_m = re.search(r"cat:\s*\"([^\"]*)\"", body)
    diff_m = re.search(r"diff:\s*(\d+)", body)
    book_m = re.search(r"book:\s*\"([^\"]*)\"", body)
    title_m = re.search(r"title:\s*\"([^\"]*)\"", body)
    ans_m = re.search(r"answer:\s*`([\s\S]*?)`\s*,\s*\n\s*\}", body)
    objs.append({
        "id": qid,
        "cat": cat_m.group(1) if cat_m else "",
        "diff": int(diff_m.group(1)) if diff_m else 0,
        "book": book_m.group(1) if book_m else "",
        "title": title_m.group(1) if title_m else "",
        "answer": ans_m.group(1) if ans_m else "",
    })

def cn_ratio(s):
    if not s:
        return 0
    cn = sum(1 for c in s if '\u4e00' <= c <= '\u9fff')
    letters = sum(1 for c in s if c.isalpha())
    return cn / letters if letters else 0

for o in objs:
    o["cn"] = round(cn_ratio(o["title"]), 2)

n_total = len(objs)
n_cn = sum(1 for o in objs if o["cn"] > 0.3)
n_en = n_total - n_cn
first = objs[:149]
rest = objs[149:]
print(f"TOTAL={n_total}  cn(title>30%)={n_cn}  en≈{n_en}")
print(f"FIRST149: cn={sum(1 for o in first if o['cn']>0.3)} / {len(first)}")
print(f"REST:     cn={sum(1 for o in rest if o['cn']>0.3)} / {len(rest)}")
print("BY BOOK:", dict(Counter(o['book'] for o in objs)))
print("SAMPLE TITLES (first 5 + id150 + id200):")
for o in objs[:5] + objs[149:150] + objs[199:200]:
    print(f"  #{o['id']} cn={o['cn']} :: {o['title'][:70]}")

with open(r"C:\Users\15188\WorkBuddy\20260511183045\quant_interview\questions.json", "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=1)
print("WROTE questions.json")
