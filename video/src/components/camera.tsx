/**
 * Камера 2,5D и «световой стол архива» — см. docs/09-cinecraft.md.
 * Словарь движений и кривая inertia — по мотивам sarpstar/cinecode (MIT), стиль стола — lemo-opuscar (MIT).
 *
 * Мир = пиксели исходного изображения (скана). Камера = центр (cx, cy) в пикселях скана + zoom,
 * где zoom 1 — предмет целиком вписан в кадр 1920×1080. Всё считается только от кадра (детерминизм).
 */
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {colors, fonts} from '../theme';

const W = 1920;
const H = 1080;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Кривые из словаря: linear · in · out · inOut · inertia (по умолчанию внутри монтажа). */
export const ease = {
	linear: (t: number) => clamp01(t),
	in: (t: number) => Math.pow(clamp01(t), 2.2),
	out: (t: number) => 1 - Math.pow(1 - clamp01(t), 2.6),
	inOut: (t: number) => smooth(clamp01(t)),
	/** 35 % линейной + 65 % плавной: движется на кадре 0 и ещё движется на склейке. */
	inertia: (t: number) => 0.35 * clamp01(t) + 0.65 * smooth(clamp01(t)),
};
export type EaseName = keyof typeof ease;

export type CamKey = {
	/** Кадр плана, на котором камера в этой точке. */
	f: number;
	cx: number;
	cy: number;
	zoom: number;
	/** Кривая участка, который заканчивается на этом ключе (по умолчанию inertia). */
	ease?: EaseName;
};

export type Cam = {cx: number; cy: number; zoom: number};

/**
 * Путь камеры по ключам. Масштаб интерполируется логарифмически (наезд ощущается равномерным),
 * центр — линейно по той же кривой.
 */
export const camAt = (keys: CamKey[], frame: number): Cam => {
	if (frame <= keys[0].f) return keys[0];
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1];
		const b = keys[i];
		if (frame <= b.f) {
			const p = ease[b.ease ?? 'inertia']((frame - a.f) / Math.max(1, b.f - a.f));
			return {
				cx: a.cx + (b.cx - a.cx) * p,
				cy: a.cy + (b.cy - a.cy) * p,
				zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * p),
			};
		}
	}
	return keys[keys.length - 1];
};

/** «Дрейф руки»: низкочастотный, с сидом, без покадровой дрожи. amount 0,2–0,5 — едва заметно. */
export const handheld = (frame: number, amount = 0.3, seed = 1) => ({
	x: amount * (9 * Math.sin(frame * 0.029 + seed * 1.7) + 4 * Math.sin(frame * 0.071 + seed * 3.1)),
	y: amount * (7 * Math.sin(frame * 0.023 + seed * 2.3) + 3 * Math.sin(frame * 0.083 + seed * 0.7)),
});

export type Plate = {src: string; w: number; h: number};

/** Экранных пикселей на пиксель скана при данном zoom. */
export const pxScale = (plate: Plate, zoom: number) => Math.min(W / plate.w, H / plate.h) * zoom;

/** Мир → экран для подписей и выносок. */
export const toScreen = (plate: Plate, cam: Cam, x: number, y: number, shake = {x: 0, y: 0}) => {
	const s = pxScale(plate, cam.zoom);
	return {x: W / 2 + (x - cam.cx) * s + shake.x, y: H / 2 + (y - cam.cy) * s + shake.y};
};

const res = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

/**
 * Предмет на подсвеченном столе. Стол — тёплое свечение под предметом, вокруг темнота зала.
 * children — экранные слои (выноски, лупа), им передаются камера и функция мир → экран.
 */
export const LightTable: React.FC<{
	plate: Plate;
	keys: CamKey[];
	shake?: number;
	seed?: number;
	/** Затемнение стола (0–1), когда поверх идёт графика. */
	dim?: number;
	blur?: number;
	children?: (cam: Cam, at: (x: number, y: number) => {x: number; y: number}) => React.ReactNode;
}> = ({plate, keys, shake = 0.3, seed = 1, dim = 0, blur = 0, children}) => {
	const frame = useCurrentFrame();
	const cam = camAt(keys, frame);
	const hh = handheld(frame, shake, seed);
	const s = pxScale(plate, cam.zoom);
	const tx = W / 2 - cam.cx * s + hh.x;
	const ty = H / 2 - cam.cy * s + hh.y;
	const m = Math.max(plate.w, plate.h) * 0.35;
	return (
		<AbsoluteFill style={{backgroundColor: colors.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: plate.w,
						height: plate.h,
						transformOrigin: '0 0',
						transform: `translate(${tx}px, ${ty}px) scale(${s})`,
					}}
				>
					{/* свет стола снизу: тёплое пятно, гаснущее к краям */}
					<div
						style={{
							position: 'absolute',
							left: -m,
							top: -m,
							width: plate.w + 2 * m,
							height: plate.h + 2 * m,
							background: `radial-gradient(ellipse at center, rgba(242,214,160,0.55) 0%, rgba(214,168,78,0.18) 38%, rgba(14,11,8,0) 70%)`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							boxShadow: `0 ${plate.h * 0.02}px ${plate.h * 0.06}px rgba(0,0,0,0.55)`,
						}}
					/>
					<Img
						src={res(plate.src)}
						style={{position: 'absolute', left: 0, top: 0, width: plate.w, height: plate.h, filter: 'contrast(1.06) saturate(0.95)'}}
					/>
				</div>
			</AbsoluteFill>
			{dim ? <AbsoluteFill style={{backgroundColor: `rgba(8,6,4,${dim})`}} /> : null}
			{children?.(cam, (x, y) => toScreen(plate, cam, x, y, hh))}
		</AbsoluteFill>
	);
};

/** Прямоугольник в пикселях скана. */
export type Rect = {x: number; y: number; w: number; h: number};

/**
 * Лупа опускается на деталь (быстрый ease-out ≈ 0,4 с), внутри — увеличение mag.
 * highlight — «строка загорается»: внутри лупы всё, кроме прямоугольника, притухает.
 */
export const Loupe: React.FC<{
	plate: Plate;
	cam: Cam;
	/** Точка скана под центром лупы. */
	target: {x: number; y: number};
	/** Где лупа на экране (по умолчанию — над target). */
	screen: {x: number; y: number};
	radius?: number;
	mag?: number;
	landAt?: number;
	liftAt?: number;
	highlight?: Rect;
	highlightFrom?: number;
}> = ({plate, cam, target, screen, radius = 230, mag = 1.7, landAt = 0, liftAt, highlight, highlightFrom = 0}) => {
	const frame = useCurrentFrame();
	const land = ease.out((frame - landAt) / 12);
	const lift = liftAt === undefined ? 0 : ease.in((frame - liftAt) / 10);
	const p = land * (1 - lift);
	if (p <= 0.001) return null;
	const scaleAnim = 1.35 - 0.35 * p;
	const s = pxScale(plate, cam.zoom) * mag;
	const D = radius * 2;
	const ix = radius - target.x * s;
	const iy = radius - target.y * s;
	const hl = highlight ? ease.inOut((frame - highlightFrom) / 14) : 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: screen.x - radius,
				top: screen.y - radius,
				width: D,
				height: D,
				opacity: p,
				transform: `scale(${scaleAnim})`,
				filter: `drop-shadow(0 ${30 * p}px ${40}px rgba(0,0,0,0.6))`,
			}}
		>
			<div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: '#d8c49a'}}>
				<Img
					src={res(plate.src)}
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: plate.w,
						height: plate.h,
						transformOrigin: '0 0',
						transform: `translate(${ix}px, ${iy}px) scale(${s})`,
						filter: 'contrast(1.12) saturate(1.02) brightness(1.04)',
					}}
				/>
				{highlight && hl > 0 ? (
					<div
						style={{
							position: 'absolute',
							left: ix + highlight.x * s,
							top: iy + highlight.y * s,
							width: highlight.w * s,
							height: highlight.h * s,
							boxShadow: `0 0 0 ${D * 2}px rgba(10,8,6,${0.5 * hl}), inset 0 0 0 ${3}px rgba(214,168,78,${hl})`,
							borderRadius: 4,
						}}
					/>
				) : null}
				{/* блик на стекле */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: '50%',
						background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 32%)',
						boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)',
					}}
				/>
			</div>
			{/* оправа */}
			<div
				style={{
					position: 'absolute',
					inset: -12,
					borderRadius: '50%',
					border: '12px solid #17120c',
					boxShadow: 'inset 0 2px 0 rgba(255,236,200,0.35), 0 0 0 1px rgba(214,168,78,0.45)',
				}}
			/>
		</div>
	);
};

/** Выноска: якорь с кольцом → линия → подпись на плашке. Линия и текст «прорисовываются» от start. */
export const Leader: React.FC<{
	anchor: {x: number; y: number};
	label: {x: number; y: number};
	start: number;
	title: string;
	note?: string;
	align?: 'left' | 'right';
}> = ({anchor, label, start, title, note, align = 'left'}) => {
	const frame = useCurrentFrame();
	const a = ease.out((frame - start) / 10);
	const l = ease.inOut((frame - start - 4) / 14);
	const t = ease.out((frame - start - 14) / 16);
	const ex = anchor.x + (label.x - anchor.x) * l;
	const ey = anchor.y + (label.y - anchor.y) * l;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<circle cx={anchor.x} cy={anchor.y} r={6 * a} fill={colors.accent} />
				<circle cx={anchor.x} cy={anchor.y} r={18 * a} fill="none" stroke={colors.accent} strokeWidth={2} opacity={a} />
				<line x1={anchor.x} y1={anchor.y} x2={ex} y2={ey} stroke={colors.accent} strokeWidth={2} />
			</svg>
			<div
				style={{
					position: 'absolute',
					top: label.y - 34,
					...(align === 'left' ? {left: label.x + 16} : {right: W - label.x + 16}),
					opacity: t,
					transform: `translateX(${(align === 'left' ? -1 : 1) * (1 - t) * 24}px)`,
					padding: '12px 20px',
					background: 'rgba(14,11,8,0.78)',
					borderLeft: `3px solid ${colors.accent}`,
					fontFamily: fonts.body,
					color: colors.text,
					textAlign: align,
				}}
			>
				<div style={{fontSize: 34, fontWeight: 700, lineHeight: 1.15}}>{title}</div>
				{note ? <div style={{fontSize: 21, color: colors.muted, marginTop: 6}}>{note}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

/** Музейная «этикетка» на тёмной плашке (название · датировка · материал · музей и номер). */
export const MuseumLabel: React.FC<{lines: string[]; start: number; x?: number; y?: number}> = ({lines, start, x = 120, y = 760}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				padding: '20px 28px',
				background: 'rgba(14,11,8,0.8)',
				borderTop: `2px solid ${colors.accent}`,
				fontFamily: fonts.body,
				color: colors.text,
				maxWidth: 820,
			}}
		>
			{lines.map((ln, i) => {
				const p = ease.out(interpolate(frame, [start + i * 5, start + i * 5 + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
				return (
					<div
						key={i}
						style={{
							opacity: p,
							transform: `translateY(${(1 - p) * 12}px)`,
							fontSize: i === 0 ? 34 : 22,
							fontWeight: i === 0 ? 700 : 500,
							color: i === 0 ? colors.text : colors.muted,
							marginTop: i === 0 ? 0 : 6,
						}}
					>
						{ln}
					</div>
				);
			})}
		</div>
	);
};
