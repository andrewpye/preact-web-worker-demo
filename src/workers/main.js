import { render } from 'https://unpkg.com/preact@latest?module'
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';
import Counter from '../components/Counter.js';

import '../utils/worker/setupDom.js';

render(html`<${Counter} />`, document.body);
