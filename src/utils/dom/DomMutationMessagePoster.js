const NON_SERIALISABLE_PROPS = [
  'children',
  'parentNode',
  '__handlers',
  '_component',
  '_componentConstructor',
  '__k', // TODO: not sure why __k is needed...
];

export default class DomMutationMessagePoster {
  _createdNodesCount = 0;

  sendMutations(mutations) {
    // TODO: don't mutate the original mutations array.
    mutations.forEach((mutation) => {
      // Remove circular references so we can serialise elements.
      [
        'addedNodes',
        'removedNodes',
        'nextSibling',
        'previousSibling',
        'target',
      ].forEach((propName) => {
        mutation[propName] = this._getSerialisableCopy(mutation[propName]);
      });
    });
  
    postMessage(JSON.parse(JSON.stringify({ type: 'domMutations', mutations })));
  }

  _getSerialisableCopy(node) {
    if (Array.isArray(node)) {
      return node.map((node) => this._getSerialisableCopy(node));
    }
  
    if (!(node instanceof document.defaultView.Node)) {
      return node;
    }
  
    // Tag each node with a unique ID for future reference.
    if (!node._id) {
      node._id = String(++this._createdNodesCount);
    }
  
    const serialisableNode = Object.keys(node).reduce((serialisableNode, propName) => {
      if (node.hasOwnProperty(propName) && NON_SERIALISABLE_PROPS.indexOf(propName) === -1) {
        serialisableNode[propName] = node[propName];
      }
  
      return serialisableNode;
    }, {});
  
    if (serialisableNode.childNodes?.length) {
      serialisableNode.childNodes = this._getSerialisableCopy(serialisableNode.childNodes);
    }
  
    return serialisableNode;
  }
};
