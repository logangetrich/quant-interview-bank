import json, os
base = r"C:\Users\15188\WorkBuddy\20260511183045\quant_interview"
with open(os.path.join(base, "questions.json"), encoding="utf-8") as f:
    objs = json.load(f)
BATCH = 80
n = 0
for i in range(0, len(objs), BATCH):
    chunk = objs[i:i+BATCH]
    fn = os.path.join(base, f"to_translate_{n:02d}.json")
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(chunk, f, ensure_ascii=False, indent=1)
    n += 1
print(f"split into {n} files, {len(objs)} questions total")
