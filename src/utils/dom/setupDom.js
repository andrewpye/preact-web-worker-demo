import createVirtualDom from './createVirtualDom.js';
import DomMutationCollector from './DomMutationCollector.js';
import hookDomMutations from './hookDomMutations.js';
import hookTextContentChanges from './hookTextContentChanges.js';

createVirtualDom();

// ==========
// TODO: extract this block to utility.
let createdNodesCount = 0;

const sendMutations = (mutations) => {
  mutations.forEach((mutation) => {
    // Remove circular references so we can serialise elements.
    [
      'addedNodes',
      'removedNodes',
      'nextSibling',
      'previousSibling',
      'target',
    ].forEach((propName) => {
      mutation[propName] = getSerialisableCopy(mutation[propName]);
    });
  });

  postMessage(JSON.parse(JSON.stringify({ type: 'domMutations', mutations })));
};

const NON_SERIALISABLE_PROPS = ['children', 'parentNode', '__handlers', '_component', '_componentConstructor', '__k']; // TODO: not sure why __k is needed...

const getSerialisableCopy = (node) => {
  if (Array.isArray(node)) {
    return node.map(getSerialisableCopy);
  }

  if (!(node instanceof document.defaultView.Node)) {
    return node;
  }

  // Tag each node with a unique ID for future reference.
  if (!node._id) {
    node._id = String(++createdNodesCount);
  }

  const serialisableNode = Object.keys(node).reduce((serialisableNode, propName) => {
    if (node.hasOwnProperty(propName) && NON_SERIALISABLE_PROPS.indexOf(propName) === -1) {
      serialisableNode[propName] = node[propName];
    }

    return serialisableNode;
  }, {});

  if (serialisableNode.childNodes?.length) {
    serialisableNode.childNodes = getSerialisableCopy(serialisableNode.childNodes);
  }

  return serialisableNode;
};
// ==========

const domMutationCollector = new DomMutationCollector(sendMutations);

const collectMutation = (...args) => { domMutationCollector.collectMutation(...args); };
hookDomMutations(collectMutation);
hookTextContentChanges(collectMutation);
