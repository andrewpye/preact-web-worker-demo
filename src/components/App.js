import { useEffect } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import RenderWorker from '../utils/workers/RenderWorker.js';

export default ({ container = document.body }) => {
	useEffect(() => {
		const worker = new RenderWorker(
			'/src/workers/main.js',
			{ type: 'module', container }
		);

		return () => {
			worker.terminate();
		};
	}, []);

	return null; // Content will be populated by render worker.
};
