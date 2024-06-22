import { render } from 'https://unpkg.com/preact@latest?module'
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';
import Counter from '../components/Counter.js';
import initialiseVirtualDom from '../utils/dom/initialiseVirtualDom.js';

initialiseVirtualDom();

render(html`<${Counter} />`, document.body);
