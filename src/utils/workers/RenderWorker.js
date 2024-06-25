import DomMutationHandler from '../dom/DomMutationHandler.js';
import EventForwarder from '../dom/EventForwarder.js';

export default class RenderWorker extends Worker {
  constructor(scriptUrl, { container, ...options }) {
    super(scriptUrl, options);

    this._domMutationHandler = new DomMutationHandler({
      container,
      onNodeFirstSeen: (node) => this._initialiseNode(node),
    });

    this._eventForwarder = new EventForwarder(window, (e) => this._forwardEvent(e));

    this.onmessage = this._handleMessage;
  }

  _initialiseNode(node) {
    if (node.nodeName !== 'IFRAME') {
      return;
    }

    // setTimeout is used here to give the frame's document a chance to be set.
    setTimeout(() => {
      [node, node.contentDocument].forEach((n) => {
        n._eventForwarder = new EventForwarder(n, (e) => this._forwardEvent(e));
      });
    });
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
