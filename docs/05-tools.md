# 05. Инструменты

Итог исследования (ноябрь 2026). Принцип: **один движок и его skills** — не смешивать несколько
видео-фреймворков и наборов skills в одном проекте.

## Используем

| Инструмент | Роль |
|---|---|
| **Remotion 4** + [remotion-dev/skills](https://github.com/remotion-dev/skills) (в `.claude/skills/`) | основной движок: сцены, анимация, рендер |
| **@remotion/three** + three.js | при необходимости: 3D-глобус для карт, модели монет/сосудов/табличек |
| **@remotion/effects** | light leak, виньетка, шум, хроматическая аберрация и др. |
| **@remotion/transitions** | `TransitionSeries` и оверлеи на склейках |
| **FFmpeg** | нарезка исходников, синтез звука, мастеринг громкости, экспорт |
| **yt-dlp** | скачивание архивной хроники (Internet Archive, NARA) и субтитров референсов — только легальные источники |
| **scripts/qc_shots.py** | автопроверка монтажа: смена кадра ≤ 4 с, уникальность планов (SSIM ≤ 0.90) |
| **scripts/find_media.py** | поиск и скачивание с лицензией: музеи открытого доступа (The Met, Cleveland, Art Institute of Chicago — CC0, без ключей), Openverse, Wikimedia, Pexels, музыка (openverse-audio) + запись в манифест вместе с музейной «этикеткой» (номер, датировка, культура) |
| **scripts/words_check.py** | клише, риторические вопросы, восклицания и длина титров в коде ролика и в сценарии (`docs/09-cinecraft.md`) |
| **src/components/camera.tsx** | камера 2,5D по ключам с кривой `inertia`, дрейф руки, «световой стол», лупа с подсветкой строки, выноски |
| **scripts/beats.py** (librosa) | находит ритм музыки и считает длительности планов так, чтобы склейки попадали в сильные доли (≤ 4 с) |
| **scripts/transcribe.py** (WhisperX) | субтитры по словам с точными таймингами из озвучки → `Caption[]` для `@remotion/captions` (ставится, когда есть голос) |
| **Openverse audio** (`find_media.py --source openverse-audio`) | бесплатная музыка и звуки CC0 / CC BY (Freesound, Jamendo, ccMixter, Wikimedia) |
| **motion-design** skill (LottieFiles, в `.claude/skills/`) | принципы тайминга, кривых и хореографии движения — загружать перед анимацией |
| **motionmaxxing** (справочник, `docs/references/motionmaxxing/`) | замеры движений профи и чек-лист «AI-slop»; как skill **не** ставим (заточен под промо брендов), правила перенесены в `docs/02-style-guide.md` |
| **auto-editor** | чистка пауз в озвучке, сжатие длинных трансляций |
| **Gemini TTS** (голос `Orus`) | озвучка по сценам (нужен ключ API) |
| Lottie через `@remotion/lottie` | готовые анимированные иконки (по необходимости) |

Идеи и рецепты (подсматривать, не подключать целиком):
[sarpstar/cinecode](https://github.com/sarpstar/cinecode) — словарь камеры, методика сценария, «жюри», стиль «световой стол» (перенесено в `docs/09-cinecraft.md`; как skill не ставим: three.js из CDN при рендере и хуки на каждый вызов инструмента);
[Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) — движения камеры и переходы;
[ConardLi/garden-skills](https://github.com/ConardLi/garden-skills) `motion-showreel` — синхронизация картинки с речью.

## По ситуации

| Инструмент | Когда |
|---|---|
| HyperFrames + gsap-skills | если лицензия Remotion не подходит (компания > 3 человек) |
| LosslessCut | ручная нарезка футажа у пользователя на компьютере |
| DaVinci Resolve MCP | если у пользователя Resolve Studio и нужна финальная цветокоррекция/звук |
| Blender MCP | фотореалистичные реконструкции зданий/артефактов (рендер у пользователя) |
| ComfyUI | художественные реконструкции (помечать «Иллюстрация») |
| OpenCreator | дубляж на другие языки |

## Не используем

Motion Canvas (почти не развивается, нет 3D), lottie-web напрямую (устарел), Manim (не наш визуальный стиль),
Babylon.js/Godot (дублируют three.js), Impeccable/Anatomy (для сайтов и IT-схем), OpenMotion (платные API),
`@remotion/google-fonts` (не работает за прокси облачной среды — шрифты локальные).

## Лицензия Remotion
Бесплатно для частных лиц и компаний до 3 человек; иначе нужна компания-лицензия
(skill `remotion-license`).

## Звук: как синтезированы эмбиент и эффекты (воспроизводимо)
```bash
# эмбиент 60 с: несколько низких синусов + коричневый шум, эхо, плавные фейды
ffmpeg -f lavfi -i "sine=frequency=55:duration=60" -f lavfi -i "sine=frequency=82.41:duration=60" \
  -f lavfi -i "sine=frequency=110.6:duration=60" -f lavfi -i "sine=frequency=164.8:duration=60" \
  -f lavfi -i "anoisesrc=color=brown:amplitude=0.3:duration=60:seed=7" -filter_complex \
  "[0]volume=0.5[a];[1]volume=0.22,tremolo=f=0.13:d=0.6[b];[2]volume=0.10,tremolo=f=0.1:d=0.8[c];[3]volume=0.04,tremolo=f=0.17:d=0.9[e];[4]lowpass=f=350,volume=0.5[d];[a][b][c][e][d]amix=inputs=5:normalize=0,aecho=0.8:0.6:700|1300:0.3|0.2,afade=t=in:d=3,afade=t=out:st=55:d=5,loudnorm=I=-22:TP=-3" \
  -ar 48000 -ac 2 -b:a 192k ambient.mp3
# удар
ffmpeg -f lavfi -i "sine=f=46:d=3" -f lavfi -i "anoisesrc=c=pink:a=0.5:d=3:seed=3" -filter_complex \
  "[0]volume=1.2[a];[1]lowpass=f=700,volume=0.6[b];[a][b]amix=inputs=2:normalize=0,afade=t=in:d=0.008,afade=t=out:st=0.03:d=2.9:curve=exp,loudnorm=I=-18:TP=-2" -ar 48000 -ac 2 hit.wav
# вжух
ffmpeg -f lavfi -i "anoisesrc=c=pink:a=0.6:d=1.6:seed=11" -filter_complex \
  "[0]highpass=f=300,lowpass=f=3500,afade=t=in:d=1.2:curve=exp,afade=t=out:st=1.2:d=0.4,loudnorm=I=-24:TP=-4" -ar 48000 -ac 2 whoosh.wav
```
Для роликов длиннее 60 с — перегенерировать эмбиент нужной длины (поменять `duration` и `afade st`).
