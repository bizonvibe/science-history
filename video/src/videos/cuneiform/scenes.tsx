import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, Counter, Overline, RevealText, clamp} from '../../components/ui';
import {CreditTag, LabelTag} from '../../templates/Footage';
import {colors, easeInOutCubic, easeOutExpo, fonts} from '../../theme';

const accentText: React.CSSProperties = {
	background: `linear-gradient(180deg, #f6e1ad 0%, ${colors.accent} 45%, ${colors.hot} 100%)`,
	WebkitBackgroundClip: 'text',
	color: 'transparent',
};

/** Размытая копия фото на фоне: у каждого плана свой тон, QC не путает планы между собой. */
const BlurredPlate: React.FC<{src: string; opacity?: number}> = ({src, opacity = 0.32}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const s = interpolate(frame, [0, durationInFrames], [1.35, 1.5], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden', opacity}}>
			<Img
				src={staticFile(src)}
				style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, filter: 'blur(38px) brightness(0.55) saturate(0.8)'}}
			/>
		</AbsoluteFill>
	);
};

export type ArtifactShotProps = {
	src: string;
	credit: string;
	/** Музейная «этикетка»: название · датировка · культура. */
	label: string;
	overline: string;
	caption?: string;
	/** Крупная цифра вместо подписи. year: true — без разделителя разрядов. */
	big?: {value: number; from?: number; prefix?: string; suffix?: string; year?: boolean; caption: string};
	/** Точка, к которой едет камера (в % от экспоната). */
	focus?: [number, number];
	zoom?: [number, number];
	/** Кольцо-выделение детали (в % от сцены экспоната) и подпись к нему. */
	ring?: {x: number; y: number; r: number; note?: string};
	/** Ширина/высота «витрины» экспоната. */
	stage?: {w: number; h: number};
	tag?: string;
	tint?: string;
};

const SPOT = 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 40%, transparent 66%)';

/** Экспонат «под лучом света» справа, слева — заголовок, подпись и музейная этикетка. */
export const ArtifactShot: React.FC<ArtifactShotProps> = ({
	src,
	credit,
	label,
	overline,
	caption,
	big,
	focus = [50, 50],
	zoom = [1.0, 1.18],
	ring,
	stage = {w: 900, h: 860},
	tag,
	tint = colors.accent,
}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const t = interpolate(frame, [0, durationInFrames], [0, 1], clamp);
	const scale = interpolate(easeInOutCubic(t), [0, 1], zoom);
	const enter = easeOutExpo(interpolate(frame, [0, 30], [0, 1], clamp));
	const ringP = ring ? easeOutExpo(interpolate(frame, [40, 80], [0, 1], clamp)) : 0;
	const circ = ring ? 2 * Math.PI * ring.r : 0;
	// PNG — предмет уже вырезан из фона; JPG — фон музейного фото гасим «лучом света».
	const cutout = src.endsWith('.png');
	const bigP = easeOutExpo(interpolate(frame, [8, 34], [0, 1], clamp));
	return (
		<AbsoluteFill>
			<Backdrop tint={tint} />
			<BlurredPlate src={src} />
			{/* Витрина с экспонатом */}
			<div
				style={{
					position: 'absolute',
					right: 60,
					top: (1080 - stage.h) / 2,
					width: stage.w,
					height: stage.h,
					opacity: enter,
					transform: `translateX(${(1 - enter) * 60}px)`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${scale})`,
						transformOrigin: `${focus[0]}% ${focus[1]}%`,
						...(cutout ? {} : {WebkitMaskImage: SPOT, maskImage: SPOT}),
					}}
				>
					<Img
						src={staticFile(src)}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							filter: cutout
								? 'contrast(1.1) saturate(0.95) drop-shadow(0 30px 50px rgba(0,0,0,0.65))'
								: 'brightness(0.8) contrast(1.15) saturate(0.95)',
						}}
					/>
				</div>
				{ring ? (
					<svg width={stage.w} height={stage.h} style={{position: 'absolute', inset: 0}}>
						<circle
							cx={(ring.x / 100) * stage.w}
							cy={(ring.y / 100) * stage.h}
							r={ring.r}
							fill="none"
							stroke={colors.accent}
							strokeWidth={3}
							strokeDasharray={circ}
							strokeDashoffset={circ * (1 - ringP)}
							transform={`rotate(-90 ${(ring.x / 100) * stage.w} ${(ring.y / 100) * stage.h})`}
						/>
						{ring.note ? (
							<text
								x={(ring.x / 100) * stage.w}
								y={(ring.y / 100) * stage.h + ring.r + 38}
								textAnchor="middle"
								fill={colors.accent}
								opacity={ringP}
								style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.12em', textTransform: 'uppercase'}}
							>
								{ring.note}
							</text>
						) : null}
					</svg>
				) : null}
			</div>
			{/* Текстовая колонка */}
			<div style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: 760, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
				<Overline start={4} color={big ? colors.hot : colors.accent}>
					{overline}
				</Overline>
				{big ? (
					<>
						<div
							style={{
								marginTop: 18,
								fontFamily: fonts.display,
								fontWeight: 700,
								fontSize: 128,
								lineHeight: 1,
								whiteSpace: 'nowrap',
								opacity: bigP,
								transform: `translateY(${(1 - bigP) * 30}px) scale(${1.25 - 0.25 * bigP})`,
								transformOrigin: 'left center',
								filter: `blur(${(1 - bigP) * 12}px) drop-shadow(0 0 30px rgba(181,72,46,0.45))`,
								...accentText,
							}}
						>
							{big.year ? (
								<YearCounter to={big.value} from={big.from ?? big.value - 60} start={8} />
							) : (
								<Counter to={big.value} start={8} duration={40} prefix={big.prefix} suffix={big.suffix} />
							)}
						</div>
						<RevealText
							text={big.caption}
							start={22}
							stagger={2}
							style={{marginTop: 22, fontFamily: fonts.body, fontWeight: 600, fontSize: 36, lineHeight: 1.3, color: colors.text}}
						/>
					</>
				) : (
					<RevealText
						text={caption ?? ''}
						start={10}
						stagger={3}
						style={{marginTop: 24, fontFamily: fonts.display, fontWeight: 500, fontSize: 52, lineHeight: 1.18, color: colors.text}}
					/>
				)}
				<MuseumLabel text={label} start={big ? 34 : 30} />
			</div>
			<CreditTag text={credit} />
			{tag ? <LabelTag text={tag} /> : null}
		</AbsoluteFill>
	);
};

const YearCounter: React.FC<{to: number; from: number; start: number}> = ({to, from, start}) => {
	const frame = useCurrentFrame();
	const p = easeOutExpo(interpolate(frame, [start, start + 40], [0, 1], clamp));
	return <span style={{fontVariantNumeric: 'tabular-nums'}}>{Math.round(from + (to - from) * p)}</span>;
};

/** Музейная этикетка: тонкая золотая линия + текст Manrope. */
const MuseumLabel: React.FC<{text: string; start: number}> = ({text, start}) => {
	const frame = useCurrentFrame();
	const p = easeOutExpo(interpolate(frame, [start, start + 26], [0, 1], clamp));
	return (
		<div style={{marginTop: 40, display: 'flex', gap: 20, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
			<div style={{width: 3, background: colors.accent, transform: `scaleY(${p})`, transformOrigin: 'top'}} />
			<div style={{fontFamily: fonts.body, fontSize: 25, lineHeight: 1.45, color: colors.muted, maxWidth: 700}}>{text}</div>
		</div>
	);
};

// ─── Шкала времени ─────────────────────────────────────────────────
const Y0 = -3400;
const Y1 = 200;
const X0 = 160;
const X1 = 1760;
const xOf = (year: number) => X0 + ((year - Y0) / (Y1 - Y0)) * (X1 - X0);

const EVENTS = [
	{year: -3100, top: 'кон. IV тыс. до н. э.', bottom: 'первые записи · Урук', at: 14},
	{year: -612, top: '612 г. до н. э.', bottom: 'гибель Ниневии', at: 40},
	{year: 79, top: '79/80 г. н. э.', bottom: 'последняя датированная табличка', at: 62},
];

export const TimelineShot: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const line = easeOutExpo(interpolate(frame, [0, 40], [0, 1], clamp));
	const span = easeOutExpo(interpolate(frame, [70, 100], [0, 1], clamp));
	const cam = interpolate(frame, [0, durationInFrames], [1.0, 1.06], clamp);
	const ticks = [-3000, -2500, -2000, -1500, -1000, -500, 1];
	return (
		<AbsoluteFill>
			<Backdrop tint={colors.cool} />
			<BlurredPlate src="images/cuneiform/met-327384-barley-account.png" opacity={0.22} />
			<div style={{position: 'absolute', left: 120, top: 110}}>
				<Overline start={2}>Шкала времени</Overline>
				<RevealText
					text={"Клинописью писали больше трёх тысяч\u00a0лет"}
					start={6}
					stagger={3}
					style={{marginTop: 22, fontFamily: fonts.display, fontWeight: 500, fontSize: 54, color: colors.text, maxWidth: 1500}}
				/>
			</div>
			<AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '50% 62%'}}>
				<svg width={1920} height={1080}>
					<line x1={X0} x2={X0 + (X1 - X0) * line} y1={640} y2={640} stroke={colors.line} strokeWidth={3} />
					{ticks.map((y) => (
						<g key={y} opacity={interpolate(frame, [10, 30], [0, 1], clamp)}>
							<line x1={xOf(y)} x2={xOf(y)} y1={630} y2={650} stroke={colors.line} strokeWidth={2} />
							<text x={xOf(y)} y={690} textAnchor="middle" fill={colors.muted} style={{fontFamily: fonts.body, fontSize: 20}}>
								{y < 0 ? `${-y} до н. э.` : 'н. э.'}
							</text>
						</g>
					))}
					{/* Отрезок жизни клинописи */}
					<rect
						x={xOf(-3100)}
						y={632}
						width={(xOf(79) - xOf(-3100)) * span}
						height={16}
						rx={8}
						fill={colors.accent}
						opacity={0.85}
					/>
					{EVENTS.map((e, i) => {
						const p = easeOutExpo(interpolate(frame, [e.at, e.at + 24], [0, 1], clamp));
						const up = i % 2 === 0;
						const x = xOf(e.year);
						const anchor = i === 0 ? 'start' : i === EVENTS.length - 1 ? 'end' : 'middle';
						const tx = i === 0 ? x - 10 : i === EVENTS.length - 1 ? x + 10 : x;
						return (
							<g key={e.year} opacity={p}>
								<circle cx={x} cy={640} r={12 * p} fill={i === 1 ? colors.hot : colors.accent} />
								<line x1={x} x2={x} y1={up ? 620 : 660} y2={up ? 520 : 760} stroke={colors.accent} strokeWidth={2} />
								<text x={tx} y={up ? 470 : 800} textAnchor={anchor} fill={colors.text} style={{fontFamily: fonts.display, fontWeight: 500, fontSize: 32}}>
									{e.top}
								</text>
								<text x={tx} y={up ? 506 : 838} textAnchor={anchor} fill={colors.muted} style={{fontFamily: fonts.body, fontSize: 26}}>
									{e.bottom}
								</text>
							</g>
						);
					})}
				</svg>
			</AbsoluteFill>
			<LabelTag text="Схема по данным The Met и Hunger & de Jong (2014)" />
		</AbsoluteFill>
	);
};

// ─── Как получается клин: схема оттиска стилуса ────────────────────
/** Позиции клиньев на «глине»: x, y, угол (0 — горизонтальный, головка слева). */
const WEDGES: [number, number, number][] = [
	[1060, 380, 0],
	[1060, 470, 0],
	[1060, 560, 0],
	[1400, 330, 90],
	[1330, 600, 35],
	[1470, 600, -35],
];

const Wedge: React.FC<{x: number; y: number; a: number; p: number}> = ({x, y, a, p}) => (
	<g transform={`translate(${x} ${y}) rotate(${a})`} opacity={p}>
		{/* головка клина — треугольный оттиск углом стилуса */}
		<path d="M0 -34 L58 0 L0 34 Z" fill="#5a3b22" />
		<path d="M0 -34 L58 0 L0 0 Z" fill="#7a5433" />
		{/* хвост — след ребра */}
		<rect x={52} y={-5} width={170 * p} height={10} rx={5} fill="#5a3b22" />
	</g>
);

export const StylusShot: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const step = 14;
	const first = 16;
	const idx = Math.min(WEDGES.length - 1, Math.max(0, Math.floor((frame - first) / step)));
	const local = (frame - first - idx * step) / step; // 0..1 внутри одного оттиска
	const [wx, wy, wa] = WEDGES[idx];
	const press = frame < first ? 0 : Math.sin(Math.min(1, Math.max(0, local)) * Math.PI);
	const lift = frame < first ? 1 : 1 - press;
	const cam = interpolate(frame, [0, durationInFrames], [1.0, 1.08], clamp);
	return (
		<AbsoluteFill>
			<Backdrop tint={colors.hot} />
			<AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '65% 50%'}}>
				<svg width={1920} height={1080}>
					<defs>
						<radialGradient id="clay" cx="45%" cy="40%" r="75%">
							<stop offset="0%" stopColor="#c99a6b" />
							<stop offset="100%" stopColor="#8a6040" />
						</radialGradient>
						<filter id="clayNoise">
							<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={7} />
							<feColorMatrix type="saturate" values="0" />
							<feComponentTransfer>
								<feFuncA type="table" tableValues="0 0.18" />
							</feComponentTransfer>
							<feComposite in2="SourceGraphic" operator="in" />
						</filter>
					</defs>
					<rect x={960} y={200} width={760} height={600} rx={60} fill="url(#clay)" />
					<rect x={960} y={200} width={760} height={600} rx={60} fill="#000" filter="url(#clayNoise)" />
					{WEDGES.map(([x, y, a], i) => {
						const t0 = first + i * step + step / 2;
						const p = easeOutExpo(interpolate(frame, [t0, t0 + 8], [0, 1], clamp));
						return <Wedge key={i} x={x} y={y} a={a} p={p} />;
					})}
					{/* Стилус: срезанная тростинка, ложится под углом и вдавливается в глину */}
					<g transform={`translate(${wx} ${wy}) rotate(${wa}) translate(${-6 - lift * 40} ${-lift * 60}) rotate(-28)`}>
						<rect x={-560} y={-14} width={560} height={28} rx={6} fill="#d9c79c" />
						<rect x={-560} y={-14} width={560} height={8} rx={4} fill="#efe2bf" />
						<path d="M0 -14 L40 0 L0 14 Z" fill="#cdb98b" />
					</g>
				</svg>
			</AbsoluteFill>
			<div style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: 760, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
				<Overline start={2}>Как пишут клином</Overline>
				<RevealText
					text="Тростниковую палочку вдавливали в сырую глину"
					start={8}
					stagger={3}
					style={{marginTop: 24, fontFamily: fonts.display, fontWeight: 500, fontSize: 50, lineHeight: 1.18, color: colors.text}}
				/>
				<RevealText
					text="cuneus — по-латыни «клин»"
					start={50}
					stagger={3}
					style={{marginTop: 30, fontFamily: fonts.body, fontWeight: 600, fontSize: 36, color: colors.accent}}
				/>
			</div>
			<LabelTag text="Схема" />
		</AbsoluteFill>
	);
};
