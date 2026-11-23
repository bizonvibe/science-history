# 01. Пайплайн: от сценария до MP4

```
сценарий.md ─► раскадровка.md ─► ассеты (футаж, текстуры, звук) + manifest
     │                                    │
     └──► озвучка (Gemini TTS, по сценам) ─┤
                                          ▼
                      Remotion: сцены / конфиг ─► tsc ─► контрольные кадры ─► рендер ─► мастеринг ─► сдача
```

## Шаг 1. Сценарий
- Файл: `scripts/<тема>/<slug>.md` по шаблону `templates/script.template.md`.
- Front matter обязателен: `title`, `slug`, `language`, `format`, `estimated_duration`, `style`,
  `selected_tts_voice`, `model`, `status`, `production_notes`.
- Сцены размечены заголовками `## ММ:СС — Название сцены`. Это граница сцены и для монтажа, и для TTS.
- Скорость дикторского текста ≈ **130–140 слов в минуту** (спокойная подача). 60 с ≈ 130 слов.

- Перед текстом: финал, поворот, крючок, бюджет слов, таблица фактов `<slug>.facts.md`; после — срезать 30 % и
  `python3 video/scripts/words_check.py scripts/<тема>/<slug>.md` (`docs/09-cinecraft.md` §3).

## Шаг 2. Раскадровка
- Файл: `scripts/<тема>/<slug>.storyboard.md` по шаблону `templates/storyboard.template.md`.
- Для каждой сцены: тайминг, текст диктора, тип сцены (см. ниже), что в кадре, данные инфографики
  с источником, футаж (ссылка + лицензия), звук.
- Типы сцен (готовые шаблоны в `video/src/templates/`):

| Тип | Когда | Длительность |
|---|---|---|
| `title` | Открытие, смена главы | 6–8 с |
| `footage` | Атмосферный кадр стока + нижняя подпись | 5–10 с |
| `stat` | **одна** крупная цифра на своём фоне — основной вариант при смене кадра каждые 4 с | 4 с |
| `stats` | 2–4 цифры в одном кадре (только для длинных форматов, не проходит правило 4 с) | 12–16 с |
| `bars` | Сравнение 2–5 объектов по одной величине | 10–13 с |
| `endCard` | Финальный титул / CTA | 8–16 с |
| `custom` | своя сцена прямо в конфиге: шкала времени, карта, стратиграфия, схема | по смыслу (пример в Kosmos: `venus-stock/scenes/PlanetTwins.tsx`) |

- У каждого плана — **строка камеры** (`docs/09-cinecraft.md` §1), в коде — ключи `camAt` из `src/components/camera.tsx`.
  Один предмет крупно (свиток, рукопись) — стиль «световой стол» (`LightTable`, `Loupe`, `Leader`, `MuseumLabel`).
- Правило ритма: **смена картинки каждые 4–8 секунд**; внутри длинной сцены что-то обязано двигаться
  (наезд камеры, появление следующей цифры, движение вдоль надписи/карты).

## Шаг 2а. Сетка планов (обязательно)
- Разбей каждую сцену на **планы по 3–4 с** (правила и типовая сетка — `docs/07-shot-rules.md`).
- 60 с = минимум 15 планов, у каждого свой визуал (не тот же фон с другим текстом).

## Шаг 3. Ассеты
- Источники и лицензии — только из `docs/04-assets-and-licenses.md`.
- Поиск и скачивание с автоматической записью в манифест:
  `python3 scripts/find_media.py search "snow leopard" --source openverse` → `python3 scripts/find_media.py get openverse <id> --query "snow leopard" --out public/images/… --manifest src/videos/<slug>/footage.manifest.json`
- Файлы кладём в `video/public/footage/`, `video/public/textures/`, `video/public/audio/`.
- Каждый файл записываем в `video/src/videos/<slug>/footage.manifest.json`
  (шаблон: `templates/footage.manifest.template.json`).
- Нарезка длинных исходников: `ffmpeg -ss <старт> -t <длит> -i in.mp4 -c copy out.mp4`
  (или `-c:v libx264 -crf 18`, если нужен точный рез).

## Шаг 3а. Музыка и ритм
- Найти трек: `python3 scripts/find_media.py search "cinematic ambient" --source openverse-audio` → только **CC0 / CC BY**
  (поиск уже отфильтрован), скачать `get openverse-audio <id> --query "…" --type audio --out public/audio/… --manifest …`.
- Посчитать склейки в бит: `python3 scripts/beats.py public/audio/<трек>.mp3 --shots 15 --max 4.0 --xfade 12`
  → массив `durationInFrames` для планов конфига и кадры сильных долей.

## Шаг 4. Озвучка (когда есть ключ Gemini)
- Модель: Gemini TTS, голос из front matter (`Orus` для Венеры). Генерировать **по сценам**, не одним запросом.
- Паузы почистить: `auto-editor voice.wav --margin 0.25s --edit audio:threshold=4%`.
- Длительность сцены берём из длительности её аудио (+0,5–1 с «воздуха»).
- Субтитры — по таймкодам слов: `python3 scripts/transcribe.py public/audio/voice.wav --lang ru` (WhisperX) →
  `voice.captions.json` → `remotion-captions` skill (подсветка текущего слова).
- Пока ключа нет — делаем ролик с титрами в кадре и музыкой (титры в кадре + эмбиент).

## Шаг 5. Сборка в Remotion
**Быстрый путь (стоки + инфографика):**
1. `cp -r video/src/videos/_template video/src/videos/<slug>`
2. В `video.config.ts`: поменять `id`, переименовать экспорт, заполнить `scenes` по раскадровке.
3. Заменить все заглушки (`credit: 'ЗАГЛУШКА…'`) на реальные файлы из `public/footage/`.
4. Сделать обёртку `<Slug>.tsx` (`() => <TemplateVideo config={…} />`) и зарегистрировать `<Composition>` в `video/src/Root.tsx`
   (по образцу `Template` в `Root.tsx`; конфиг с `custom`-сценой нельзя передавать через `defaultProps`).
4а. Анимации и реконструкции (не реальная съёмка) — с `label: 'Художественная реконструкция'` у футажа.
5. Сумма `durationInFrames` = длина ролика × 30.

**Полный путь (кастомные сцены):** папка `video/src/videos/<slug>/scenes/`, сцена подключается в конфиг как `custom`.
Переиспользуй блоки из `src/components/` (`RevealText`, `Counter`, `Overline`, `Backdrop`,
`SceneFade`, `Grain`, `Vignette`, `LightLeakOverlay`) и сцены из `src/templates/scenes.tsx`.

## Шаг 6. Проверка
```bash
cd video
npx tsc -p .                                   # 0 ошибок
scripts/stills.sh <Composition> 90 300 700 ... # по 1–2 кадра на каждую сцену
```
`python3 scripts/words_check.py src/videos/<slug>/` — клише в титрах = ошибка.
По контактному листу кадров ответь на шесть вопросов «жюри» (`docs/09-cinecraft.md` §5) и внеси до трёх правок.
Открой кадры и проверь чек-лист из `docs/06-delivery.md` (текст не обрезан, ничего не налезает,
текстуры загрузились, цифры верные, подписи источников на месте).

## Шаг 7. Рендер и мастеринг
```bash
scripts/render.sh <Composition> <имя-файла>    # → video/out/<имя-файла>.mp4, громкость −14 LUFS, затем QC монтажа
```
60 с в 1080p рендерятся ≈ 5–7 минут на 4 ядрах без GPU.

## Шаг 8. Сдача
Строго по `docs/06-delivery.md`: MP4 пользователю, отчёт, титры источников, коммит кода и манифеста.
