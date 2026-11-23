import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TemplateVideo} from '../../templates/TemplateVideo';
import {horiGatesConfig, shotStart} from './video.config';

/** Лупа ложится на стекло (план, кадр приземления) и шорох папируса на проездах по столу. */
const CLICKS = [
	[4, 6],
	[9, 4],
	[10, 6],
	[11, 0],
].map(([shot, f]) => shotStart(shot) + f);
const PAPER = [2, 6, 8, 14].map((shot) => shotStart(shot));

export const HoriGates: React.FC = () => (
	<AbsoluteFill>
		<TemplateVideo config={horiGatesConfig} />
		{CLICKS.map((f) => (
			<Sequence key={`c${f}`} from={f} durationInFrames={20}>
				<Audio src={staticFile('audio/hori/loupe-click.wav')} volume={0.8} />
			</Sequence>
		))}
		{PAPER.map((f) => (
			<Sequence key={`p${f}`} from={Math.max(0, f - 6)} durationInFrames={30}>
				<Audio src={staticFile('audio/hori/paper.wav')} volume={0.7} />
			</Sequence>
		))}
	</AbsoluteFill>
);
