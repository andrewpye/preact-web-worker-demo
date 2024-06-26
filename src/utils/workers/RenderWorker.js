import DomMutationHandler from '../dom/DomMutationHandler.js';
import EventForwarder from '../dom/EventForwarder.js';
import NodeSerialiser from '../dom/NodeSerialiser.js';

export default class RenderWorker extends Worker {
  constructor(scriptUrl, { container, ...options }) {
    super(scriptUrl, options);

    this._nodes = new Map();

    this._domMutationHandler = new DomMutationHandler({
      container,
      nodes: this._nodes,
      onNodeFirstSeen: (node) => this._initialiseNode(node),
    });

    this._eventForwarder = new EventForwarder(window, (e) => this._forwardEvent(e));

    this.onmessage = this._handleMessage;
  }

  _initialiseNode(node) {
    this._nodes.set(node._id, node);

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
    switch (data.type) {
      case 'domMutations':
        this._domMutationHandler.processMutations(data.mutations);
        break;

      case 'parseHtml':
        this._parseHtml(data);
        break;
    }
  }

  _forwardEvent(event) {
    this.postMessage({ type: 'event', event });
  }

  _parseHtml({ text }) {
    const doc = new DOMParser().parseFromString(text, 'text/html');

    this.postMessage({
      type: 'htmlParsed',
      tree: NodeSerialiser.serialiseNode(doc.documentElement),
    });
  }
}
