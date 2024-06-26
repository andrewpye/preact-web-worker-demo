import DomMutationHandler from '../dom/DomMutationHandler.js';
import EventForwarder from '../dom/EventForwarder.js';

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
    // Parse a string of HTML into a new document instance.
    const doc = new DOMParser().parseFromString(text, 'text/html');

    // Convert the document's contents into a serializable object.
    // TODO: extract this to a reusable utility.
    const convertElementToObject = (e) => ({
      nodeName: e.nodeName,
      nodeType: e.nodeType,
      nodeValue: e.nodeValue,
      attributes: [...e.attributes].map(({ name, value }) => ({ name, value })),
      childNodes: [...e.childNodes].map(convertElementToObject),
    });
    const parsedHtmlDocumentElement = convertElementToObject(doc.documentElement);

    this.postMessage({ type: 'htmlParsed', tree: JSON.stringify(parsedHtmlDocumentElement) });
  }
}
