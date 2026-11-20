import type {SceneSpec, VideoConfig} from '../../templates/types';
import {colors} from '../../theme';
import {ArtifactShot, type ArtifactShotProps, StylusShot, TimelineShot} from './scenes';

/**
 * «Клинопись: письмо из глины» — тестовый ролик 60 с, 15 планов по 4 с.
 * Сценарий: scripts/cuneiform/cuneiform.md · раскадровка: scripts/cuneiform/cuneiform.storyboard.md
 * Все артефакты — The Met Open Access (CC0), см. footage.manifest.json.
 */
const SHOT = 132; // 120 кадров = 4 с + 12 на наплыв
const IMG = 'images/cuneiform/';

const artifact = (props: ArtifactShotProps, duration = SHOT): SceneSpec => ({
	type: 'custom',
	durationInFrames: duration,
	component: () => <ArtifactShot {...props} />,
});

export const cuneiformConfig: VideoConfig = {
	id: 'cuneiform',
	music: {src: 'audio/ambient.mp3', volume: 0.9},
	sfx: {whoosh: 'audio/whoosh.wav', hit: 'audio/hit.wav'},
	cut: 'crossfade',
	crossfadeFrames: 12,
	leakAt: [4, 9, 13],
	// «Удары» на появлении крупных цифр (планы 10 и 14: начало = индекс × 120, +8 кадров).
	extraHits: [9 * 120 + 8, 13 * 120 + 8], // план 11 (тип stat) — удар добавляется сам
	scenes: [
		// 1. Заголовок
		{
			type: 'title',
			durationInFrames: SHOT,
			overline: 'Месопотамия · научная история',
			lines: [{text: 'Клинопись:'}, {text: 'письмо из глины', accent: true}],
			background: {
				src: `${IMG}met-322613-ashurnasirpal-relief.jpg`,
				kind: 'image',
				credit: 'The Metropolitan Museum of Art, 32.143.6',
				zoom: [1.12, 1.24],
				panX: -50,
				dim: 0.55,
			},
		},
		// 2. Протоклинописная табличка
		artifact({
			src: `${IMG}met-329081-proto-tablet.png`,
			credit: 'The Metropolitan Museum of Art, 1988.433.1',
			overline: 'Одна из древнейших записей',
			caption: 'Первые тексты — не стихи, а отчёты',
			label: 'Протоклинописная табличка: раздача ячменя · ок. 3100–2900 гг. до н. э. · Шумер, период Джемдет-Наср',
			focus: [30, 45],
			zoom: [1.0, 1.15],
			stage: {w: 760, h: 700},
		}),
		// 3. Шкала времени
		{type: 'custom', durationInFrames: SHOT, component: TimelineShot},
		// 4. Пиктограммы крупно
		artifact({
			src: `${IMG}met-327384-barley-account.png`,
			credit: 'The Metropolitan Museum of Art, 1988.433.2',
			overline: 'Сначала — рисунки и числа',
			caption: 'Учёт ячменя и полбы',
			label: 'Хозяйственная табличка · ок. 3100–2900 гг. до н. э. · Шумер',
			focus: [30, 45],
			zoom: [1.0, 1.2],
			stage: {w: 820, h: 620},
			ring: {x: 50, y: 50, r: 130},
			tint: colors.green,
		}),
		// 5. Схема: как получается клин
		{type: 'custom', durationInFrames: SHOT, component: StylusShot},
		// 6. Частное письмо
		artifact({
			src: `${IMG}met-325849-private-letter.png`,
			credit: 'The Metropolitan Museum of Art, 66.245.8',
			overline: 'Клин за клином',
			caption: 'Письма, счета, договоры',
			label: 'Частное письмо · ок. XX–XIX вв. до н. э. · староассирийские торговые колонии',
			focus: [20, 30],
			zoom: [1.0, 1.18],
			stage: {w: 760, h: 780},
		}),
		// 7. Ученическая табличка
		artifact({
			src: `${IMG}met-321878-student-exercise.jpg`,
			credit: 'The Metropolitan Museum of Art, 86.11.251',
			side: 'left',
			overline: 'Школа писцов',
			caption: 'Писать учились годами',
			label: 'Ученическое упражнение · ок. XX–XVI вв. до н. э. · Вавилония',
			focus: [50, 50],
			zoom: [1.0, 1.15],
			stage: {w: 860, h: 860},
			tint: colors.cool,
		}),
		// 8. Таблица умножения
		artifact({
			src: `${IMG}met-324587-multiplication.png`,
			credit: 'The Metropolitan Museum of Art, 57.16.2',
			overline: 'Наука',
			caption: 'Таблица умножения на глине',
			label: 'Табличка с таблицей умножения · ок. XX–XVI вв. до н. э. · Вавилония',
			focus: [30, 30],
			zoom: [1.3, 1.05],
		}),
		// 9. Атрахасис
		artifact({
			src: `${IMG}met-321999-atrahasis.png`,
			credit: 'The Metropolitan Museum of Art, 86.11.378a',
			side: 'left',
			overline: 'Литература',
			caption: 'Вавилонский миф о потопе — «Атрахасис»',
			label: 'Фрагмент таблички · ок. VII–VI вв. до н. э. · Вавилония',
			focus: [80, 55],
			zoom: [1.0, 1.18],
			stage: {w: 760, h: 820},
			tint: colors.hot,
		}),
		// 10. Цифра: 3000 лет
		artifact({
			src: `${IMG}met-324015-gudea-cone.png`,
			credit: 'The Metropolitan Museum of Art, 45.90',
			overline: 'Долгая жизнь письма',
			big: {value: 3000, prefix: '> ', caption: 'лет писали клинописью — на шумерском, аккадском и других языках'},
			label: 'Посвятительный конус Гудеа · ок. 2090 г. до н. э. · Лагаш',
			focus: [15, 50],
			zoom: [1.0, 1.2],
			stage: {w: 820, h: 520},
		}),
		// 11. Цифра: 30 000 табличек — рельеф во весь кадр (другая раскладка, чтобы склейка с планом 10 читалась)
		{
			type: 'stat',
			durationInFrames: SHOT,
			overline: 'Библиотека Ашшурбанапала',
			stat: {value: 30000, prefix: '> ', caption: 'табличек и фрагментов нашли в Ниневии'},
			background: {
				src: `${IMG}met-322612-ashurbanipal-relief.jpg`,
				kind: 'image',
				credit: 'The Metropolitan Museum of Art, 32.143.5 · рельеф, ок. 668–627 гг. до н. э.',
				zoom: [1.15, 1.35],
				panX: 60,
				dim: 0.35,
			},
		},
		// 12. Гибель Ниневии
		artifact({
			src: `${IMG}met-322622-siege-relief.png`,
			credit: 'The Metropolitan Museum of Art, 32.143.15',
			overline: '612 г. до н. э. · Ниневия разрушена',
			caption: 'Пожар обжёг глину — и сохранил тексты',
			label: 'Рельеф: ассирийские войска осаждают город · ок. 704–681 гг. до н. э.',
			focus: [25, 40],
			zoom: [1.0, 1.2],
			tint: colors.hot,
		}),
		// 13. Поздние тексты
		artifact({
			src: `${IMG}met-321903-balag.jpg`,
			credit: 'The Metropolitan Museum of Art, 86.11.279',
			overline: 'Закат клинописи',
			caption: 'Последняя датированная табличка — 79/80\u00a0г.\u00a0н.\u00a0э.',
			label: 'Поздняя табличка с храмовым плачем (балаг) · ок. II–I вв. до н. э.',
			focus: [50, 50],
			zoom: [1.0, 1.12],
			stage: {w: 700, h: 900},
			tint: colors.cool,
		}),
		// 14. Цифра: 1857 — дешифровка
		artifact({
			src: `${IMG}met-321614-nebuchadnezzar-cylinder.png`,
			credit: 'The Metropolitan Museum of Art, 85.15',
			overline: 'Расшифровка',
			big: {value: 1857, from: 1800, year: true, caption: 'четыре учёных независимо перевели одну надпись — и переводы совпали в главном'},
			label: 'Цилиндр с надписью Навуходоносора II · ок. 604–562 гг. до н. э. · Вавилония',
			focus: [20, 50],
			zoom: [1.0, 1.2],
			stage: {w: 900, h: 600},
		}),
		// 15. Финал
		{
			type: 'endCard',
			durationInFrames: 120,
			overline: 'Science History',
			title: 'Глина помнит',
			accent: 'пять тысяч лет',
			cta: 'Новые выпуски — на канале',
		},
	],
};
