#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
OCR 一个扫描版 PDF -> 纯文本。
渲染：pypdfium2（内嵌 pdfium，无需 poppler/系统依赖）
识别：Tesseract（本机已有：C:\Program Files\Tesseract-OCR\tesseract.exe，英文包 eng）
用法：
  python ocr_pdf.py <pdf路径> [-o 输出txt] [--dpi 300] [--pages 1-20]
"""
import subprocess, os, sys, argparse, pypdfium2 as pdfium

def find_tesseract():
    cands = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Users\15188\AppData\Local\Programs\Python\Python312\Scripts\tesseract.exe",
    ]
    # 也试探 TRAE 自带版（有中文包 chi_sim，但本脚本默认英文）
    trae = r"C:\Users\15188\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\app\tesseract\tesseract.exe"
    for b in cands + [trae]:
        if os.path.exists(b):
            return b
    # 最后尝试 PATH
    try:
        r = subprocess.run(["tesseract", "--version"], capture_output=True, text=True, timeout=10)
        if r.returncode == 0:
            return "tesseract"
    except Exception:
        pass
    return None

def ocr_pdf(pdf_path, out_path, dpi=300, pages=None, lang="eng"):
    tess = find_tesseract()
    if not tess:
        raise SystemExit("未找到 tesseract，请确认已安装。")
    doc = pdfium.PdfDocument(pdf_path)
    n = len(doc)
    scale = dpi / 72.0
    want = range(pages[0]-1, pages[1]) if pages else range(n)
    tmp_png = out_path + ".tmp.png"
    chunks = []
    for i in want:
        if i < 0 or i >= n:
            continue
        page = doc[i]
        pil = page.render(scale=scale).to_pil()
        pil.save(tmp_png)
        base = out_path + ".tmp"
        subprocess.run([tess, tmp_png, base, "-l", lang],
                       capture_output=True, text=True, timeout=120)
        tp = base + ".txt"
        if os.path.exists(tp):
            chunks.append(f"\n\n===== PAGE {i+1} =====\n" + open(tp, encoding="utf-8", errors="ignore").read())
            os.remove(tp)
        else:
            chunks.append(f"\n\n===== PAGE {i+1} =====\n[OCR FAILED]")
    doc.close()
    if os.path.exists(tmp_png):
        os.remove(tmp_png)
    header = f"# OCR: {os.path.basename(pdf_path)}\n# engine: {tess}  lang: {lang}  dpi: {dpi}\n"
    open(out_path, "w", encoding="utf-8").write(header + "".join(chunks))
    print(f"完成：{len(chunks)} 页 -> {out_path}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("-o", "--out", default=None)
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--pages", default=None, help="如 1-20")
    ap.add_argument("--lang", default="eng")
    a = ap.parse_args()
    out = a.out or (os.path.splitext(a.pdf)[0] + "_ocr.txt")
    pg = tuple(int(x) for x in a.pages.split("-")) if a.pages else None
    ocr_pdf(a.pdf, out, dpi=a.dpi, pages=pg, lang=a.lang)
