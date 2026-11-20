import {Composition} from 'remotion';
import {TemplateVideo, totalDuration} from './templates/TemplateVideo';
import {RosettaStone, rosettaConfig} from './videos/rosetta-stone/RosettaStone';
import {templateConfig} from './videos/_template/video.config';

// Все ролики: 1920×1080, 30 fps. Каждый новый ролик регистрируется здесь отдельной <Composition>.
// Ролик со своей (custom) сценой — через обёртку () => <TemplateVideo config={...} />, без defaultProps.
const VIDEO = {fps: 30, width: 1920, height: 1080} as const;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* Шаблон «стоки + инфографика» из конфига — копировать для новых роликов. */}
			<Composition
				id="Template"
				component={TemplateVideo}
				durationInFrames={totalDuration(templateConfig)}
				defaultProps={{config: templateConfig}}
				{...VIDEO}
			/>
			<Composition id="RosettaStone" component={RosettaStone} durationInFrames={totalDuration(rosettaConfig)} {...VIDEO} />
		</>
	);
};
