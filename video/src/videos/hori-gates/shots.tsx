/**
 * «16 ворот жреца Хори» — 15 планов по 4 с в стиле «световой стол архива» (docs/09-cinecraft.md §4).
 * Строка камеры каждого плана — первым комментарием. Факты — scripts/egypt/hori-gates.facts.md.
 * Мир = пиксели скана Cleveland Museum of Art 1921.1032 (5499×931).
 */
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Leader, LightTable, Loupe, MuseumLabel, ease, pxScale, type Plate, type Rect} from '../../components/camera';
import {Counter, Overline, RevealText} from '../../components/ui';
import {CreditTag, LabelTag} from '../../templates/Footage';
import {colors, fonts} from '../../theme';

export const HORI: Plate = {src: 'images/hori/hori-full.jpg', w: 5499, h: 931};
const BAKENMUT: Plate = {src: 'images/hori/cma-bakenmut.jpg', w: 3400, h: 1057};
const CR_HORI = 'Cleveland Museum of Art, 1921.1032 · CC0';

const accentText: React.CSSProperties = {
	background: `linear-gradient(180deg, #f6e1ad 0%, ${colors.accent} 45%, ${colors.hot} 100%)`,
	WebkitBackgroundClip: 'text',
	color: 'transparent',
};

/** Тень снизу/слева под титры. */
const Shade: React.FC<{side?: 'bottom' | 'left' | 'top'; strength?: number}> = ({side = 'bottom', strength = 0.85}) => {
	const dir = side === 'bottom' ? '0deg' : side === 'left' ? '90deg' : '180deg';
	return <AbsoluteFill style={{background: `linear-gradient(${dir}, rgba(8,6,4,${strength}) 0%, rgba(8,6,4,${strength * 0.85}) 28%, rgba(8,6,4,0) 60%)`}} />;
};

/** Титр: надзаголовок + строка (≤ 6 слов) + необязательная акцентная строка. */
const Caption: React.FC<{
	over?: string;
	text: string;
	accent?: string;
	start?: number;
	accentStart?: number;
	size?: number;
	top?: number;
	bottom?: number;
	left?: number;
}> = ({over, text, accent, start = 8, accentStart, size = 66, top, bottom = 120, left = 120}) => (
	<div style={{position: 'absolute', left, right: 120, ...(top !== undefined ? {top} : {bottom})}}>
		{over ? <Overline start={start}>{over}</Overline> : null}
		<RevealText
			text={text}
			start={start + 6}
			style={{marginTop: 18, fontFamily: fonts.display, fontWeight: 500, fontSize: size, lineHeight: 1.12, color: colors.text}}
		/>
		{accent ? (
			<RevealText
				text={accent}
				start={accentStart ?? start + 18}
				style={{marginTop: 10, fontFamily: fonts.display, fontWeight: 700, fontSize: size * 1.05, lineHeight: 1.12}}
				wordStyle={() => accentText}
			/>
		) : null}
	</div>
);

// ─── 1. Крючок ─────────────────────────────────────────────────────
// наезд, 4 с, медленно, ease-out (крючок: самый быстрый на кадре 0), к стражу с ножом; лупа уже лежит на нём
export const S01Hook: React.FC = () => {
	const keys = [
		{f: 0, cx: 3420, cy: 400, zoom: 2.75},
		{f: 132, cx: 3380, cy: 380, zoom: 3.05, ease: 'out' as const},
	];
	return (
		<LightTable plate={HORI} keys={keys} shake={0.35} seed={2}>
			{(cam, at) => (
				<>
					<Loupe plate={HORI} cam={cam} target={{x: 3330, y: 300}} screen={{x: 1300, y: 430}} radius={270} mag={1.55} landAt={-12} />
					<Shade />
					<Caption over="Египет · около 1069–945 гг. до н. э." text="У каждых ворот —" accent="страж с ножом" start={4} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 2. Отъезд-раскрытие ───────────────────────────────────────────
// отъезд-раскрытие, 4 с, медленно → средне, ease-in, от стража к свитку; лупа поднимается
export const S02Reveal: React.FC = () => {
	const keys = [
		{f: 0, cx: 3380, cy: 380, zoom: 3.05},
		{f: 132, cx: 2900, cy: 560, zoom: 1.35, ease: 'in' as const},
	];
	return (
		<LightTable plate={HORI} keys={keys} shake={0.25} seed={3}>
			{(cam) => (
				<>
					<Loupe plate={HORI} cam={cam} target={{x: 3330, y: 300}} screen={{x: 1300, y: 430}} radius={270} mag={1.55} landAt={-12} liftAt={0} />
					<Shade side="top" strength={0.9} />
					<Caption over="Кливлендский музей искусств" text="Книга мёртвых" accent="жреца Хори" top={90} start={20} size={72} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 3. Этикетка ───────────────────────────────────────────────────
// панорама по столу, 4 с, медленно, inertia, вдоль ладьи и ложа слева направо
export const S03Label: React.FC = () => {
	const keys = [
		{f: 0, cx: 640, cy: 520, zoom: 2.5},
		{f: 132, cx: 1180, cy: 520, zoom: 2.6},
	];
	return (
		<LightTable plate={HORI} keys={keys} seed={4}>
			{() => (
				<>
					<Shade strength={0.75} />
					<MuseumLabel
						start={10}
						y={700}
						lines={[
							'Книга мёртвых Хори',
							'Египет, Третий переходный период, XXI династия',
							'около 1069–945 гг. до н. э. · папирус, высота 23 см',
							'Cleveland Museum of Art, 1921.1032',
						]}
					/>
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 4. Хронология (своя графика) ──────────────────────────────────
// проезд, 4 с, медленно, linear, вдоль шкалы времени справа налево (к эпохе Хори)
const SPANS = [
	{name: 'Древнее царство', from: 2647, to: 2124, tone: colors.neutral},
	{name: 'Новое царство', from: 1540, to: 1069, tone: colors.cool},
	{name: 'Третий переходный период', from: 1069, to: 715, tone: colors.accent},
];
export const S04Timeline: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / 132;
	const x0 = 2800;
	const x1 = 600;
	const px = (y: number) => 160 + ((x0 - y) / (x0 - x1)) * 1600;
	const slide = interpolate(t, [0, 1], [70, -70]);
	const sc = interpolate(t, [0, 1], [1.0, 1.06]);
	const keys = [
		{f: 0, cx: 4600, cy: 470, zoom: 2.2},
		{f: 132, cx: 4400, cy: 470, zoom: 2.3},
	];
	return (
		<LightTable plate={HORI} keys={keys} dim={0.72} blur={10} shake={0}>
			{() => (
				<>
					<AbsoluteFill style={{transform: `translateX(${slide}px) scale(${sc})`}}>
						<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
							<line x1={px(x0)} y1={600} x2={px(x1)} y2={600} stroke={colors.line} strokeWidth={2} />
							{[2500, 2000, 1500, 1000].map((y) => (
								<g key={y}>
									<line x1={px(y)} y1={588} x2={px(y)} y2={770} stroke={colors.line} strokeWidth={1} />
									<text x={px(y)} y={800} fill={colors.muted} fontFamily="Manrope" fontSize={24} textAnchor="middle">
										{y}
									</text>
								</g>
							))}
							{SPANS.map((s, i) => {
								const p = ease.out((frame - 6 - i * 12) / 20);
								const w = (px(s.to) - px(s.from)) * p;
								return (
									<g key={s.name} opacity={p}>
										<rect x={px(s.from)} y={i === 2 ? 560 : 575} width={w} height={i === 2 ? 80 : 50} fill={s.tone} opacity={i === 2 ? 0.95 : 0.55} rx={4} />
										<text x={px(s.from)} y={i === 2 ? 690 : 555} fill={i === 2 ? colors.accent : colors.text} fontFamily="Manrope" fontWeight={700} fontSize={i === 2 ? 28 : 24}>
											{s.name}
										</text>
										<text x={px(s.from)} y={i === 2 ? 724 : 680} fill={colors.muted} fontFamily="Manrope" fontSize={21}>
											{`${s.from}–${s.to} гг. до н. э.`}
										</text>
									</g>
								);
							})}
							{(() => {
								const p = ease.out((frame - 44) / 18);
								const a = px(1069);
								const b = px(945);
								return (
									<g opacity={p}>
										<rect x={a - 4} y={548 - 10 * p} width={b - a + 8} height={104 + 10 * p} fill="none" stroke={colors.text} strokeWidth={3} />
										<text x={(a + b) / 2} y={515} fill={colors.text} fontFamily="Unbounded" fontWeight={700} fontSize={34} textAnchor="middle">
											Хори
										</text>
									</g>
								);
							})()}
						</svg>
						{/* предмет-ориентир Нового царства: писец Медту */}
						<Img
							src={staticFile('images/hori/cma-scribe-medthu.jpg')}
							style={{
								position: 'absolute',
								left: px(1510) - 60,
								top: 230,
								height: 220,
								borderRadius: 6,
								opacity: ease.out((frame - 26) / 18),
								boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								left: px(1510) - 350,
								top: 330,
								textAlign: 'right',
								fontFamily: fonts.body,
								fontSize: 20,
								color: colors.muted,
								opacity: ease.out((frame - 32) / 18),
								width: 260,
							}}
						>
							Писец Медту, около 1479–1425 гг. до н. э. · CMA 1920.2004
						</div>
					</AbsoluteFill>
					<Caption over="Хронология · схема" text="Тысяча лет после Древнего царства" start={4} top={110} size={58} />
					<LabelTag text="Схема по датировкам Кливлендского музея" />
				</>
			)}
		</LightTable>
	);
};

// ─── 5. Название ───────────────────────────────────────────────────
// наезд на деталь, 4 с, медленно, inertia, к столбцу иероглифов; строка загорается в лупе
export const S05Name: React.FC = () => {
	const keys = [
		{f: 0, cx: 2250, cy: 420, zoom: 3.0},
		{f: 132, cx: 2200, cy: 400, zoom: 3.3},
	];
	return (
		<LightTable plate={HORI} keys={keys} seed={5}>
			{(cam) => (
				<>
					<Loupe
						plate={HORI}
						cam={cam}
						target={{x: 2100, y: 300}}
						screen={{x: 1380, y: 420}}
						radius={260}
						mag={1.6}
						landAt={6}
						highlight={{x: 2078, y: 125, w: 50, h: 330}}
						highlightFrom={30}
					/>
					<Shade strength={0.9} />
					<Caption over="Сами египтяне называли её" text="«Книга" accent="выхода днём»" start={10} accentStart={22} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 6. Около 200 заклинаний ───────────────────────────────────────
// панорама, 4 с, средне, inertia, по строкам другого свитка (Бакенмут) справа налево
export const S06Spells: React.FC = () => {
	const keys = [
		{f: 0, cx: 2300, cy: 420, zoom: 2.4},
		{f: 132, cx: 1500, cy: 470, zoom: 2.55},
	];
	return (
		<LightTable plate={BAKENMUT} keys={keys} dim={0.45} seed={6}>
			{() => (
				<>
					<Shade side="left" strength={0.95} />
					<div style={{position: 'absolute', left: 120, top: 300}}>
						<Overline start={4}>Не единая книга</Overline>
						<div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 200, lineHeight: 1, marginTop: 20, ...accentText}}>
							<Counter to={200} start={10} duration={40} prefix="≈ " />
						</div>
						<RevealText
							text="заклинаний: из них выбирали своё"
							start={24}
							style={{marginTop: 16, fontFamily: fonts.display, fontWeight: 500, fontSize: 52, color: colors.text, maxWidth: 900}}
						/>
					</div>
					<CreditTag text="Книга мёртвых Бакенмута, 1000–900 гг. до н. э. · Cleveland Museum of Art, 1914.882 · CC0" />
				</>
			)}
		</LightTable>
	);
};

// ─── 7. Две записи рядом ───────────────────────────────────────────
// проезд, 4 с, медленно, inertia, вдоль двух свитков слева направо
export const S07TwoRecords: React.FC = () => {
	const frame = useCurrentFrame();
	const t = ease.inertia(frame / 132);
	const dx = interpolate(t, [0, 1], [60, -60]);
	const z = interpolate(t, [0, 1], [1.0, 1.07]);
	const item = (src: string, left: number, top: number, h: number, delay: number) => {
		const p = ease.out((frame - delay) / 16);
		return (
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					left,
					top: top + (1 - p) * 30,
					height: h,
					opacity: p,
					boxShadow: '0 30px 60px rgba(0,0,0,0.65)',
				}}
			/>
		);
	};
	return (
		<AbsoluteFill style={{backgroundColor: colors.bg, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse at 50% 55%, rgba(242,214,160,0.35) 0%, rgba(214,168,78,0.1) 40%, rgba(14,11,8,0) 70%)',
				}}
			/>
			<AbsoluteFill style={{transform: `translateX(${dx}px) scale(${z})`}}>
				{item('images/hori/cma-buiruharmut.jpg', 300, 260, 520, 0)}
				{item('images/hori/cma-bakenmut-vignette.jpg', 1160, 210, 620, 8)}
				<Leader anchor={{x: 560, y: 780}} label={{x: 480, y: 880}} start={26} title="Буирухармут" note="1000–900 гг. до н. э. · CMA 1914.733" />
				<Leader anchor={{x: 1370, y: 830}} label={{x: 1330, y: 900}} start={34} align="right" title="Бакенмут" note="1000–900 гг. до н. э. · CMA 1914.724" />
			</AbsoluteFill>
			<Caption text="Каждому — свой набор" start={4} top={90} size={62} />
			<CreditTag text="Cleveland Museum of Art · CC0" />
		</AbsoluteFill>
	);
};

// ─── 8. Владелец ───────────────────────────────────────────────────
// наклон вниз, 4 с, медленно, inertia, к фигуре у колонны
export const S08Owner: React.FC = () => {
	const keys = [
		{f: 0, cx: 1700, cy: 470, zoom: 2.7},
		{f: 132, cx: 1640, cy: 600, zoom: 2.9},
	];
	return (
		<LightTable plate={HORI} keys={keys} seed={8}>
			{() => (
				<>
					<Shade strength={0.9} />
					<Caption over="Свиток написан для одного человека" text="Жрец" accent="Хори" start={8} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 9. Шестнадцать ворот ──────────────────────────────────────────
// панорама по столу, 4 с, средне, linear, вдоль ворот слева направо; рамки ворот загораются, когда камера их проходит
const GATES: Rect[] = [
	...[1840, 2180, 2525, 2855, 3200, 3555, 3905, 4245].map((x) => ({x, y: 115, w: 185, h: 340})),
	...[2180, 2525, 2850, 3185, 3550, 3900, 4235].map((x) => ({x, y: 470, w: 185, h: 340})),
];
export const S09Gates: React.FC = () => {
	const frame = useCurrentFrame();
	const keys = [
		{f: 0, cx: 2300, cy: 470, zoom: 1.85, ease: 'linear' as const},
		{f: 132, cx: 3900, cy: 470, zoom: 1.85, ease: 'linear' as const},
	];
	return (
		<LightTable plate={HORI} keys={keys} dim={0.2} shake={0.2} seed={9}>
			{(cam, at) => (
				<>
					<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
						{GATES.map((g, i) => {
							const a = at(g.x, g.y);
							const s = pxScale(HORI, cam.zoom);
							const lit = clamp01((1120 - a.x) / 160);
							return (
								<rect
									key={i}
									x={a.x}
									y={a.y}
									width={g.w * s}
									height={g.h * s}
									fill="none"
									stroke={colors.accent}
									strokeWidth={3}
									opacity={lit * 0.9}
									rx={3}
								/>
							);
						})}
					</svg>
					<Shade side="top" strength={0.95} />
					<div style={{position: 'absolute', left: 120, top: 80, display: 'flex', alignItems: 'baseline', gap: 32}}>
						<div style={{fontFamily: fonts.display, fontWeight: 700, fontSize: 150, lineHeight: 1, ...accentText}}>
							<Counter to={16} start={6} duration={50} />
						</div>
						<RevealText
							text="ворот на пути Хори"
							start={16}
							style={{fontFamily: fonts.display, fontWeight: 500, fontSize: 56, color: colors.text}}
						/>
					</div>
					<LabelTag text="Число — по описанию музея" />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// ─── 10. Имена стражей ─────────────────────────────────────────────
// наезд, 4 с, медленно, inertia, к стражу с головой шакала; лупа опускается
export const S10Names: React.FC = () => {
	const keys = [
		{f: 0, cx: 3320, cy: 560, zoom: 2.5},
		{f: 132, cx: 3300, cy: 570, zoom: 2.7},
	];
	const names = ['«Владычица гнева»', '«Огненный»', '«Длиннорогий бык»'];
	const frame = useCurrentFrame();
	return (
		<LightTable plate={HORI} keys={keys} seed={10}>
			{(cam, at) => (
				<>
					<Loupe plate={HORI} cam={cam} target={{x: 2955, y: 620}} screen={at(2955, 620)} radius={250} mag={1.5} landAt={4} />
					<AbsoluteFill style={{background: 'linear-gradient(270deg, rgba(8,6,4,0.95) 0%, rgba(8,6,4,0.85) 38%, rgba(8,6,4,0) 62%)'}} />
					<div style={{position: 'absolute', left: 1180, top: 300}}>
						<Overline start={10}>Имена стражей · по описанию музея</Overline>
						{names.map((n, i) => {
							const p = ease.out((frame - 22 - i * 14) / 16);
							return (
								<div
									key={n}
									style={{
										marginTop: i === 0 ? 34 : 18,
										fontFamily: fonts.display,
										fontWeight: 500,
										fontSize: 50,
										color: colors.text,
										opacity: p,
										transform: `translateX(${(1 - p) * 30}px)`,
									}}
								>
									{n}
								</div>
							);
						})}
					</div>
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 11. Пароль ────────────────────────────────────────────────────
// наезд на деталь, 4 с, медленно, inertia, к сидящему стражу с двумя ножами
export const S11Password: React.FC = () => {
	const keys = [
		{f: 0, cx: 4080, cy: 470, zoom: 2.6},
		{f: 132, cx: 4040, cy: 430, zoom: 2.95},
	];
	return (
		<LightTable plate={HORI} keys={keys} seed={11}>
			{(cam, at) => (
				<>
					<Loupe plate={HORI} cam={cam} target={{x: 3995, y: 320}} screen={at(3995, 320)} radius={240} mag={1.5} landAt={6} />
					<Shade strength={0.9} />
					<Caption text="Без пароля" accent="не пропустит" start={10} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 12. ★ Поворот: пароли в самом свитке ──────────────────────────
// держание: почти неподвижно (≤ 2 % «дыхания»), строка загорается; потом лупа чуть смещается вдоль столбца
export const S12Turn: React.FC = () => {
	const keys = [
		{f: 0, cx: 3640, cy: 300, zoom: 3.2},
		{f: 132, cx: 3630, cy: 290, zoom: 3.26},
	];
	return (
		<LightTable plate={HORI} keys={keys} shake={0.15} seed={12}>
			{(cam) => (
				<>
					<Loupe
						plate={HORI}
						cam={cam}
						target={{x: 3830, y: 290}}
						screen={{x: 1420, y: 400}}
						radius={270}
						mag={1.45}
						landAt={0}
						highlight={{x: 3795, y: 125, w: 55, h: 330}}
						highlightFrom={14}
					/>
					<Shade strength={0.92} />
					<Caption over="Пароли записаны в самом свитке" text="Свиток —" accent="это пропуск" start={6} accentStart={40} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 13. Путь свитка (своя графика) ────────────────────────────────
// наезд, 4 с, медленно, inertia, вдоль маршрута Фивы → Лондон → Кливленд
const STOPS = [
	{x: 330, title: 'Вероятно, Фивы', note: 'место происхождения'},
	{x: 960, title: 'Sotheby’s, Лондон', note: 'куплен через Говарда Картера'},
	{x: 1590, title: 'Кливленд', note: 'в музее с 1921 года'},
];
export const S13Provenance: React.FC = () => {
	const frame = useCurrentFrame();
	const t = ease.inertia(frame / 132);
	const z = interpolate(t, [0, 1], [1.0, 1.08]);
	const keys = [
		{f: 0, cx: 900, cy: 470, zoom: 3.2},
		{f: 132, cx: 1000, cy: 470, zoom: 3.3},
	];
	return (
		<LightTable plate={HORI} keys={keys} dim={0.74} blur={12} shake={0}>
			{() => (
				<>
					<AbsoluteFill style={{transform: `scale(${z})`}}>
						<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
							{STOPS.slice(1).map((s, i) => {
								const p = ease.inOut((frame - 18 - i * 22) / 22);
								const x0 = STOPS[i].x;
								return <line key={i} x1={x0} y1={560} x2={x0 + (s.x - x0) * p} y2={560} stroke={colors.accent} strokeWidth={3} strokeDasharray="10 10" />;
							})}
							{STOPS.map((s, i) => {
								const p = ease.out((frame - 6 - i * 22) / 14);
								return (
									<g key={s.title} opacity={p}>
										<circle cx={s.x} cy={560} r={12 * p} fill={colors.accent} />
										<circle cx={s.x} cy={560} r={30 * p} fill="none" stroke={colors.accent} strokeWidth={2} />
									</g>
								);
							})}
						</svg>
						{STOPS.map((s, i) => {
							const p = ease.out((frame - 12 - i * 22) / 16);
							return (
								<div
									key={s.title}
									style={{
										position: 'absolute',
										left: s.x - 220,
										width: 440,
										top: 610,
										textAlign: 'center',
										opacity: p,
										fontFamily: fonts.body,
									}}
								>
									<div style={{fontSize: 36, fontWeight: 700, color: colors.text}}>{s.title}</div>
									<div style={{fontSize: 24, color: colors.muted, marginTop: 8}}>{s.note}</div>
								</div>
							);
						})}
					</AbsoluteFill>
					<Caption over="Путь свитка" text="Из Фив — в Огайо" start={4} top={120} size={60} />
					<LabelTag text="Схема · по провенансу в карточке музея" />
				</>
			)}
		</LightTable>
	);
};

// ─── 14. ★ Хори прошёл ворота ──────────────────────────────────────
// наезд, 4 с, медленно → средне, inertia, к фигуре Хори справа (зеркало первого плана)
export const S14Reborn: React.FC = () => {
	const keys = [
		{f: 0, cx: 4950, cy: 520, zoom: 2.3},
		{f: 132, cx: 5150, cy: 500, zoom: 2.95},
	];
	return (
		<LightTable plate={HORI} keys={keys} seed={14}>
			{(cam, at) => (
				<>
					<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(8,6,4,0.92) 0%, rgba(8,6,4,0.7) 35%, rgba(8,6,4,0) 60%)'}} />
					<Leader anchor={at(5170, 470)} label={{x: 900, y: 340}} start={34} align="right" title="Хори" note="ворота пройдены" />
					<Caption over="По описанию музея" text="справа Хори" accent="рождён заново" start={8} accentStart={50} size={62} />
					<CreditTag text={CR_HORI} />
				</>
			)}
		</LightTable>
	);
};

// ─── 15. Финал: стол становится указателем ─────────────────────────
// отъезд, 4 с, медленно, inOut, ко всему свитку; держание на названии
export const S15End: React.FC = () => {
	const keys = [
		{f: 0, cx: 3400, cy: 300, zoom: 1.45},
		{f: 110, cx: 2750, cy: 260, zoom: 0.92, ease: 'inOut' as const},
	];
	const frame = useCurrentFrame();
	return (
		<LightTable plate={HORI} keys={keys} shake={0.15} seed={15}>
			{() => (
				<>
					<AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(8,6,4,0.97) 0%, rgba(8,6,4,0.9) 42%, rgba(8,6,4,0) 62%)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center'}}>
						<RevealText
							text="16 ворот жреца Хори"
							start={8}
							style={{justifyContent: 'center', fontFamily: fonts.display, fontWeight: 700, fontSize: 84, color: colors.text}}
						/>
						<div
							style={{
								marginTop: 26,
								fontFamily: fonts.body,
								fontSize: 26,
								letterSpacing: '0.2em',
								textTransform: 'uppercase',
								color: colors.accent,
								opacity: ease.out((frame - 30) / 20),
							}}
						>
							Science History
						</div>
					</div>
					<CreditTag text={`Источники и титры — в описании · ${CR_HORI}`} />
				</>
			)}
		</LightTable>
	);
};

