import DomMutationHandler from '../dom/DomMutationHandler.js';
import EventForwarder from '../dom/EventForwarder.js';

export default class RenderWorker extends Worker {
  constructor(scriptUrl, { container, ...options }) {
    super(scriptUrl, options);

    this._domMutationHandler = new DomMutationHandler({ container });

    this._eventForwarder = new EventForwarder(window, (e) => this._forwardEvent(e));

    this.onmessage = this._handleMessage;
  }

  _handleMessage({ data }) {
    if (data.type === 'domMutations') {
      this._domMutationHandler.processMutations(data.mutations);
    }
  }

  _forwardEvent(event) {
    this.postMessage({ type: 'event', event });
  }
}
