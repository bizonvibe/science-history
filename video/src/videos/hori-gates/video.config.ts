import type {VideoConfig} from '../../templates/types';
import {
	S01Hook, S02Reveal, S03Label, S04Timeline, S05Name, S06Spells, S07TwoRecords, S08Owner,
	S09Gates, S10Names, S11Password, S12Turn, S13Provenance, S14Reborn, S15End,
} from './shots';

/**
 * «16 ворот жреца Хори» — 60 с, 15 планов по 4 с (132 кадра = 120 + 12 на наплыв, последний 120).
 * Раскадровка: scripts/egypt/hori-gates.storyboard.md · факты: scripts/egypt/hori-gates.facts.md
 * Без диктора (ключа Gemini TTS нет): текст в кадре + музыка + звуки лупы.
 */
const SHOTS = [
	S01Hook, S02Reveal, S03Label, S04Timeline, S05Name, S06Spells, S07TwoRecords, S08Owner,
	S09Gates, S10Names, S11Password, S12Turn, S13Provenance, S14Reborn, S15End,
];

/** Кадр начала плана i на общей шкале. */
export const shotStart = (i: number) => i * 120;

export const horiGatesConfig: VideoConfig = {
	id: 'hori-gates',
	cut: 'crossfade',
	crossfadeFrames: 12,
	music: {src: 'audio/hori/hori-music.mp3', volume: 0.9},
	sfx: {whoosh: 'audio/whoosh.wav', hit: 'audio/hit.wav'},
	// смена главы: хронология и путь свитка
	leakAt: [3, 12],
	// удары: «≈ 200», «16», загорается строка-пароль
	extraHits: [shotStart(5) + 12, shotStart(8) + 8, shotStart(11) + 40],
	scenes: SHOTS.map((component, i) => ({
		type: 'custom' as const,
		durationInFrames: i === SHOTS.length - 1 ? 120 : 132,
		component,
	})),
};
