#!/usr/bin/env python3
"""Проверка слов ролика: клише, риторические вопросы, восклицания, длина титров (docs/09-cinecraft.md §3).

Идея — по мотивам words_check из sarpstar/cinecode (MIT), список клише — свой, русский.

Использование:
  python3 scripts/words_check.py src/videos/<slug>/            # все .ts/.tsx: строки с кириллицей = титры
  python3 scripts/words_check.py ../scripts/<тема>/<slug>.md    # сценарий: текст вне комментариев и front matter

Код выхода 1 — есть клише (рендер с ними не сдаём). Длина карточек и вопросы — предупреждения.
"""
import re
import sys
from pathlib import Path

BANNED = [
    r'тайн\w*,? покрыт\w* мрак\w*', r'загадк\w* век\w*', r'сквозь век\w*', r'вне времени', r'одно можно сказать точно',
    r'истори\w*,? котор\w* (изменил|потряс)', r'представьте себе', r'давайте разбер[её]мся', r'знаете ли вы', r'а что если',
    r'не просто [\w\s]{1,30}, а ', r'и тогда вс[её] изменилось', r'остальное\s*[—–-]\s*истори', r'удивительн\w*', r'поразительн\w*',
    r'невероятн\w*', r'шокирующ\w*', r'учёные в шоке', r'скрыт\w* знани\w*', r'запретн\w*', r'о ч[её]м молчат',
    r'завораживающ\w*', r'броса\w* вызов времени', r'древн\w* пришельц\w*',
]
CARD_WORDS = 6   # титр-карточка
LABEL_WORDS = 12  # музейная этикетка / выноска


def texts_from_code(path: Path):
    src = path.read_text(encoding='utf-8')
    src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
    src = re.sub(r'(?m)//.*$', '', src)
    pattern = r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`|>([^<>{}]*[а-яёА-ЯЁ][^<>{}]*)<"
    for m in re.finditer(pattern, src):
        s = next(g for g in m.groups() if g is not None)
        if m.group(3) is not None:  # шаблонная строка: подстановки ${…} не текст
            s = re.sub(r'\$\{[^}]*\}', ' ', s)
        s = ' '.join(s.split())
        if re.search('[а-яё]', s, re.I):
            line = src.count('\n', 0, m.start()) + 1
            yield line, s


def texts_from_md(path: Path):
    src = path.read_text(encoding='utf-8')
    src = re.sub(r'^---\n.*?\n---\n', lambda m: '\n' * m.group(0).count('\n'), src, flags=re.S)
    src = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), src, flags=re.S)
    for i, ln in enumerate(src.splitlines(), 1):
        if ln.strip() and not ln.lstrip().startswith(('#', '|', '>')) and re.search('[а-яё]', ln, re.I):
            yield i, ln.strip()


def main(paths):
    files = []
    for p in map(Path, paths):
        files += sorted(p.rglob('*.ts*')) if p.is_dir() else [p]
    errors = warnings = excl = 0
    for f in files:
        items = texts_from_md(f) if f.suffix == '.md' else texts_from_code(f)
        for line, s in items:
            low = s.lower()
            for b in BANNED:
                if re.search(b, low):
                    print(f'❌ {f}:{line}: клише «{re.search(b, low).group(0)}» → «{s}»')
                    errors += 1
            excl += s.count('!')
            if f.suffix != '.md':
                n = len(s.split())
                if n > LABEL_WORDS:
                    print(f'⚠️  {f}:{line}: {n} слов в одном титре (карточка ≤ {CARD_WORDS}, этикетка ≤ {LABEL_WORDS}) → «{s}»')
                    warnings += 1
            if s.rstrip().endswith('?'):
                print(f'⚠️  {f}:{line}: вопрос в титрах — риторический вопрос зрителю слабее недосказанности → «{s}»')
                warnings += 1
    if excl > 2:
        print(f'⚠️  восклицательных знаков: {excl} (на ролик ≤ 2)')
        warnings += 1
    print(f'words_check: {len(files)} файл(ов), клише: {errors}, предупреждений: {warnings}')
    return 1 if errors else 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1:]))
