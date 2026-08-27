# -*- coding: utf-8 -*-
import re
h = open('index.html', encoding='utf-8').read()
scripts = re.findall(r'<script[^>]*>(.*?)</script>', h, re.S)
open('_check.js', 'w', encoding='utf-8').write('\n'.join(scripts))
print('script_blocks', len(scripts), 'chars', sum(len(s) for s in scripts))
# 额外校验：统计 questions 数组元素数量
m = re.search(r'const questions\s*=\s*\[(.*?)\n\];', h, re.S)
if m:
    objs = re.findall(r'\{\s*id:\s*\d+', m.group(1))
    print('questions_count_in_array', len(objs))
else:
    print('questions array NOT found')
