import { render } from 'https://unpkg.com/preact@latest?module'
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';
import App from './components/App.js';

const renderIntoContainer = (App, container = document.body) =>
  render(html`<${App} container=${container} />`, container);

renderIntoContainer(App, document.getElementById('app-container'));
