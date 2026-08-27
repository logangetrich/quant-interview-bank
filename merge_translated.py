import re, json, os
base = r"C:\Users\15188\WorkBuddy\20260511183045\quant_interview"
IDX = os.path.join(base, "index.html")

# collect translations
trans = {}
for fn in os.listdir(base):
    if fn.startswith("trans_") and fn.endswith(".json"):
        with open(os.path.join(base, fn), encoding="utf-8") as f:
            data = json.load(f)
        for o in data:
            trans[o["id"]] = (o.get("title"), o.get("answer"))

ids = list(range(1, 636))
missing = [i for i in ids if i not in trans]
print("MISSING IDS:", missing, "count", len(missing))

with open(os.path.join(base, "questions.json"), encoding="utf-8") as f:
    orig = json.load(f)

def esc_title(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')

def esc_ans(s):
    # template literal: escape backslash first, then backtick, then $ (avoid interpolation)
    s = s.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")
    return s

blocks = []
for o in orig:
    tid, tans = trans.get(o["id"], (o["title"], o["answer"]))
    tid = tid if tid is not None else o["title"]
    tans = tans if tans is not None else o["answer"]
    blk = f'  id: {o["id"]}, cat: "{o["cat"]}", diff: {o["diff"]}, book: "{o["book"]}",\n'
    blk += f'  title: "{esc_title(tid)}",\n'
    blk += f'  answer: `{esc_ans(tans)}`,\n'
    blocks.append(blk)

new_arr = "const questions = [\n" + "\n".join(blocks) + "];\n"

with open(IDX, encoding="utf-8") as f:
    html = f.read()
new_html = re.sub(r"const questions\s*=\s*\[.*?\n\];", new_arr, html, count=1, flags=re.S)
with open(IDX, "w", encoding="utf-8") as f:
    f.write(new_html)
print("MERGED. new array chars:", len(new_arr), "missing:", len(missing))
