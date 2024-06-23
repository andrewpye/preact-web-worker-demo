import createVirtualDom from './createVirtualDom.js';
import DomMutationCollector from './DomMutationCollector.js';
import DomMutationMessagePoster from './DomMutationMessagePoster.js';
import hookDomMutations from './hookDomMutations.js';
import hookTextContentChanges from './hookTextContentChanges.js';
import NodeCollection from './NodeCollection.js';

export default class WorkerisedRenderer {
  constructor(render) {
    this._render = render;

    this._nodeCollection = new NodeCollection();

    this._domMutationMessagePoster = new DomMutationMessagePoster(this._nodeCollection);

    this._domMutationCollector = new DomMutationCollector((mutations) => {
      this._domMutationMessagePoster.sendMutations(mutations);
    });

    this._initialise();
  }
  
  _initialise() {
    createVirtualDom();

    const collectMutation = (...args) => {
      this._domMutationCollector.collectMutation(...args);
    };

    hookDomMutations(collectMutation);
    hookTextContentChanges(collectMutation);

    addEventListener('message', ({ data }) => this._processMessage(data));

    this._render();
  }

  _tagNode(node) {
    // Tag each node with a unique ID so we can retrieve them later.
    if (node._id) {
      return;
    }

    node._id = String(++this._nodesCount);
    this._nodes[node._id] = node;
  }

  _processMessage(data) {
    switch (data.type) {
      case 'event':
        this._forwardedEventHandler.handleEvent(data.event);
        break;
    }
  }
}
