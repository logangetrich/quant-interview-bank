# -*- coding: utf-8 -*-
"""
v2: 三本 OCR -> 量化面试题库 (题干+答案) 配对抽取，按号配对红宝书答案，
分类对齐 index.html 既有 7 标签 (prob/brain/finance/algo/calc/logic/stoch)，
去重后续接 id 注入 index.html 的 questions 数组。
"""
import re, os, shutil, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
IDX  = os.path.join(BASE, 'index.html')

BOOK_FILES = {
    'yellow': 'yellow_ocr.txt',
    'red':    'red_ocr.txt',
    'hots':   'hots_ocr.txt',
}

CUE = re.compile(r'\b(what|how|why|which|do|does|is|are|can|will|would|should|give|name|tell|state|define|describe|mention|list|find|show|prove|compute|calculate|derive|suppose|assume|let|explain|estimate|approximate|determine|if|are|does)\b', re.I)
SPLIT_PAT = re.compile(r'(?:\n|^)\s*(ANSWER|Answer|SOLUTION|Solution)\s*:', re.M)

def load(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()

def clean_text(t):
    t = re.sub(r'===== PAGE \d+ =====\n?', '', t)
    t = re.sub(r'^# OCR:.*\n', '', t, flags=re.M)
    t = re.sub(r'^# engine:.*\n', '', t, flags=re.M)
    return t

# ---------- 各书抽取 ----------
def extract_yellow(text):
    q, a = {}, {}
    for m in re.finditer(r'^Question\s+(\d+)\.?\s+(.*)$', text, re.M):
        key = 'y'+m.group(1); start = m.end()
        nxt = re.search(r'\nQuestion\s+\d+\.', text[start:])
        end = start + nxt.start() if nxt else len(text)
        block = (m.group(2) + '\n' + text[start:end]).strip()
        sm = SPLIT_PAT.search(block)
        if sm:
            q[key] = block[:sm.start()].strip(); a[key] = block[sm.end():].strip()
        else:
            q[key] = block
    return q, a

def extract_red(text):
    q, a = {}, {}
    for m in re.finditer(r'^QUESTION\s+([\d.]+)\.?\s+(.*)$', text, re.I | re.M):
        key = 'r'+m.group(1); start = m.end()
        nxt = re.search(r'\nQUESTION\s+[\d.]+\.|\nSolution to Question\s+[\d.]+\.', text[start:], re.I)
        end = start + nxt.start() if nxt else len(text)
        q[key] = (m.group(2) + '\n' + text[start:end]).strip()
    for m in re.finditer(r'^Solution to Question\s+([\d.]+)\.?\s*(.*)$', text, re.I | re.M):
        key = 'r'+m.group(1); start = m.end()
        nxt = re.search(r'\nSolution to Question\s+[\d.]+\.|\nQUESTION\s+[\d.]+\.', text[start:], re.I)
        end = start + nxt.start() if nxt else len(text)
        a[key] = (m.group(2) + '\n' + text[start:end]).strip()
    return q, a

def extract_hots(text):
    q, a = {}, {}
    pat = re.compile(r'^Question\s+([\d.]+)\s*:\s*(.*)$', re.I | re.M)
    for m in pat.finditer(text):
        key = 'h'+m.group(1); rest = m.group(2).strip()
        if len(rest) < 10:
            continue
        start = m.end()
        nxt = pat.search(text[start:])
        end = start + nxt.start() if nxt else len(text)
        block = (rest + '\n' + text[start:end]).strip()
        sm = SPLIT_PAT.search(block)
        if sm:
            q[key] = block[:sm.start()].strip(); a[key] = block[sm.end():].strip()
        else:
            q[key] = block
    return q, a

# ---------- 分类 / 难度 ----------
def classify(text):
    t = text.lower()
    if re.search(r'\b(c\+\+|python|function|algorithm|code|program|recursion|sort|data structure|big-o|big o|implement|runtime)\b', t):
        return 'algo'
    if re.search(r'\b(stochastic|brownian|wiener|sde|martingale|ito|geometric brownian|random walk)\b', t):
        return 'stoch'
    if re.search(r'\b(option|put|call|black-scholes|volatility|hedge|strike|bond|swap|forward|future|derivative|arbitrage|greeks?|implied|yield|interest rate)\b', t):
        return 'finance'
    if re.search(r'\b(matrix|eigen|linear algebra|determinant|calculus|integral|derivative of|differential|series|limit|optimi|convex|vector|tensor|equation)\b', t):
        return 'calc'
    if re.search(r'\b(ant|spider|coin|dice|clock|bridge|river|lake|mountain|puzzle|logical|sheep|wolf|prisoner|hats?|weigh|burn|measure|rotate|cut)\b', t):
        return 'logic'
    if re.search(r'\b(probability|distribution|variance|covariance|correlation|bayes|poisson|binomial|normal|gaussian|markov|central limit|expected|random variable|sample|chance)\b', t):
        return 'prob'
    if re.search(r'\b(brain|riddle|trick)\b', t):
        return 'brain'
    if re.search(r'\b(estimate|approximate|mental|without calculator|order of magnitude)\b', t):
        return 'calc'
    return 'prob'

def infer_diff(text):
    t = text.lower()
    if re.search(r'\b(sde|stochastic|prove|derive|rigorous|theorem|eigen|differential equation|martingale)\b', t):
        return 3
    if re.search(r'\b(estimate|approximate|quick|brain|puzzle|riddle|how many|what is|which)\b', t) and len(text) < 180:
        return 1
    return 2

def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()

def quality_ok(q):
    if not q or len(q) < 35 or len(q) > 1500:
        return False
    letters = sum(c.isalpha() for c in q)
    if letters / max(1, len(q)) < 0.45:
        return False
    if not (CUE.search(q) or '?' in q):
        return False
    if re.search(r'^\s*(chapter|contents|preface|acknowledg|solution|answer|index|bibliography|figure|table)\b', q, re.I):
        return False
    return True

# ---------- 主流程 ----------
def build_entries():
    seen = set()
    entries = []
    extractors = {'yellow': extract_yellow, 'red': extract_red, 'hots': extract_hots}
    for book in BOOK_FILES:
        text = clean_text(load(os.path.join(BASE, BOOK_FILES[book])))
        qs, ans = extractors[book](text)
        raw = len(qs); kept = 0
        for key, q in qs.items():
            if not quality_ok(q):
                continue
            n = norm(q[:80])
            if n in seen:
                continue
            seen.add(n)
            a = ans.get(key, '')
            cat = classify(q + ' ' + a)
            diff = infer_diff(q + ' ' + a)
            title = q.split('\n')[0].strip()
            if len(title) > 120:
                title = title[:117].rstrip() + '…'
            answer = a if a else '(答案见原书 / see original book)'
            entries.append({'book': book, 'cat': cat, 'diff': diff,
                            'title': title, 'q': q, 'a': answer})
            kept += 1
        print(f'[{book}] questions={raw}  kept={kept}  with_answer={sum(1 for e in entries if e["book"]==book and e["a"]!="(答案见原书 / see original book)")}')
    return entries

# ---------- 注入 index.html ----------
def get_existing(html):
    m = re.search(r'const questions\s*=\s*\[', html)
    arr_start = m.end()
    close = html.find('\n];', arr_start)
    if close == -1:
        close = html.find('];', arr_start)
    arr_text = html[arr_start:close]
    maxid = 0
    titles = set()
    for om in re.finditer(r'\{\s*id:\s*(\d+).*?title:\s*"((?:[^"\\]|\\.)*)"', arr_text, re.S):
        maxid = max(maxid, int(om.group(1)))
        titles.add(norm(om.group(2)))
    return arr_start, close, maxid, titles

def esc(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('"', '\\"')

def inject(html, entries, existing_titles):
    arr_start, close, maxid, _ = get_existing(html)
    nid = maxid
    new_blocks = []
    added = 0
    for e in entries:
        n = norm(e['title'])
        if n in existing_titles:
            continue
        existing_titles.add(n)
        nid += 1
        q_html = esc(e['q']).replace('\n', '<br/>\n    ')
        a_html = esc(e['a']).replace('\n', '<br/>\n    ')
        block = (
            f"  {{\n"
            f"    id: {nid}, cat: \"{e['cat']}\", diff: {e['diff']}, book: \"{e['book']}\",\n"
            f"    title: \"{esc(e['title'])}\",\n"
            f"    answer: `<br/>\n    <strong>原题：</strong>{q_html}<br/><br/>\n"
            f"    <strong>参考解答：</strong>{a_html}`\n"
            f"  }},\n"
        )
        new_blocks.append(block)
        added += 1
    insertion = ''.join(new_blocks)
    new_html = html[:arr_start] + insertion + html[arr_start:]
    return new_html, added, nid

if __name__ == '__main__':
    entries = build_entries()
    from collections import Counter
    print(f'\nTOTAL new candidate: {len(entries)}')
    print('cat :', dict(Counter(e['cat'] for e in entries)))
    print('book:', dict(Counter(e['book'] for e in entries)))
    html = load(IDX)
    arr_start, close, maxid, titles = get_existing(html)
    print(f'\n现有题目 max id = {maxid}, 已有标题 {len(titles)} 条')
    new_html, added, new_max = inject(html, entries, titles)
    # 备份
    shutil.copy2(IDX, IDX + '.bak')
    with open(IDX, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f'已注入 {added} 条新题，题库总数 -> {new_max}。原文件备份为 index.html.bak')
    # node --check
    node = shutil.which('node')
    if node:
        r = subprocess.run([node, '--check', IDX], capture_output=True, text=True)
        print('node --check:', 'OK' if r.returncode == 0 else 'FAIL\n' + r.stderr[:500])
    else:
        print('未找到 node，跳过语法校验')
