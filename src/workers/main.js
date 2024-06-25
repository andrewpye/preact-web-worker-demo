import { render } from 'https://unpkg.com/preact@latest?module'
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';
import Counter from '../components/Counter.js';
import WorkerSafeFrame from '../components/WorkerSafeFrame.js';
import WorkerisedRenderer from '../utils/dom/WorkerisedRenderer.js';

new WorkerisedRenderer(
  () => render(html`
    <${WorkerSafeFrame}>
      <${Counter} />
    </WorkerSafeFrame>
  `, document.body)
);
