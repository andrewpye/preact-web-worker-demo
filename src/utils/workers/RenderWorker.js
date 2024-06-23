import DomMutationHandler from '../dom/DomMutationHandler.js';

export default class RenderWorker extends Worker {
  constructor(scriptUrl, { container, ...options }) {
    super(scriptUrl, options);

    this._domMutationHandler = new DomMutationHandler({ container });

    this.onmessage = this._handleMessage;
  }

  _handleMessage({ data }) {
    if (data.type === 'domMutations') {
      this._domMutationHandler.processMutations(data.mutations);
    }
  }
}
