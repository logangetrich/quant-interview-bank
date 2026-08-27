#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
三本扫描版量化面试题 PDF 全本 OCR（pypdfium2 渲染 + tesseract 识别）。
特性：
  - 自写日志 ocr_all.log（带时间戳），逐页 flush，不依赖 shell 重定向
  - 逐页 try/except，单页失败跳过不崩整本
  - 断点续跑：输出文件里已有的 PAGE 标记会自动跳过，重启接着干
  - 脱离父进程运行（由 cmd /c start 拉起），不被后台任务回收
  - glob 模糊匹配避开红皮书文件名里的全角冒号乱码
"""
import os, time, glob, subprocess, pypdfium2 as pdfium

BASE = r"C:\Users\15188\Desktop\量化物料\量化书籍\电子书英文"
OUTDIR = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(OUTDIR, "ocr_all.log")
DPI = 250

def log(msg):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass
    print(line, flush=True)

def find_tesseract():
    cands = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Users\15188\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\app\tesseract\tesseract.exe",
    ]
    for b in cands:
        if os.path.exists(b):
            return b
    return None

def done_pages(outp):
    if not os.path.exists(outp):
        return 0
    n = 0
    with open(outp, encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("===== PAGE "):
                try:
                    n = max(n, int(line.split()[2]))
                except Exception:
                    pass
    return n

def ocr_book(tag, pattern, out_name):
    tess = find_tesseract()
    if not tess:
        log(f"[FAIL {tag}] 未找到 tesseract"); return
    hit = glob.glob(os.path.join(BASE, pattern))
    if not hit:
        log(f"[FAIL {tag}] 未匹配到文件: {pattern}"); return
    pdf = hit[0]
    outp = os.path.join(OUTDIR, out_name)
    already = done_pages(outp)
    log(f"[START {tag}] {os.path.basename(pdf)}  已完页数={already}  dpi={DPI}")
    doc = pdfium.PdfDocument(pdf)
    total = len(doc)
    scale = DPI / 72.0
    tmp_png = outp + ".tmp.png"
    base = outp + ".tmp"
    t0 = time.time()
    count = 0
    if already == 0 and not os.path.exists(outp):
        open(outp, "w", encoding="utf-8").write(
            f"# OCR: {os.path.basename(pdf)}\n# engine: {tess}  lang: eng  dpi: {DPI}\n")
    for i in range(total):
        pnum = i + 1
        if pnum <= already:
            continue
        try:
            page = doc[i]
            pil = page.render(scale=scale).to_pil()
            pil.save(tmp_png)
            subprocess.run([tess, tmp_png, base, "-l", "eng"],
                           capture_output=True, text=True, timeout=120)
            tp = base + ".txt"
            if os.path.exists(tp):
                txt = open(tp, encoding="utf-8", errors="ignore").read()
                os.remove(tp)
            else:
                txt = "[OCR FAILED]"
            with open(outp, "a", encoding="utf-8") as f:
                f.write(f"\n\n===== PAGE {pnum} =====\n" + txt)
            count += 1
            if count % 10 == 0:
                log(f"  {tag} 进度 {pnum}/{total}  已用 {time.time()-t0:.0f}s")
        except Exception as e:
            log(f"  {tag} PAGE {pnum} 错误: {e!r}")
            continue
    doc.close()
    if os.path.exists(tmp_png):
        try: os.remove(tmp_png)
        except Exception: pass
    if os.path.exists(outp):
        mb = os.path.getsize(outp) / 1e6
    else:
        mb = 0
    log(f"[DONE {tag}] 新增 {count} 页 -> {outp} ({mb:.1f}MB)  用时 {time.time()-t0:.0f}s")

books = [
    ("yellow", "150_Most_Frequently_Asked_Questions_on_Quant_Interviews.pdf", "yellow_ocr.txt"),
    ("red",    "Quant Job Interview Questions And Answers.pdf",               "red_ocr.txt"),
    ("hots",   "Heard on the Street*.pdf",                                     "hots_ocr.txt"),
]

if __name__ == "__main__":
    log("==== OCR 批次启动（断点续跑） ====")
    for b in books:
        ocr_book(*b)
    log("==== 全部完成 ====")
