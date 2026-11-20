import {Composition} from 'remotion';
import {TemplateVideo, totalDuration} from './templates/TemplateVideo';
import {templateConfig} from './videos/_template/video.config';
import {Cuneiform} from './videos/cuneiform/Cuneiform';
import {cuneiformConfig} from './videos/cuneiform/video.config';

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
			{/* «Клинопись: письмо из глины» — тестовый ролик 60 с. */}
			<Composition id="Cuneiform" component={Cuneiform} durationInFrames={totalDuration(cuneiformConfig)} {...VIDEO} />
		</>
	);
};
