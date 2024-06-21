import undom from 'https://unpkg.com/undom@latest?module';
import DomMutationObserver from '../DomMutationObserver.js';

globalThis.document = undom();

const pendingMutations = [];
let createdNodesCount = 0;

const collectMutation = (mutation) => {
  const isFirstMutationInBatch = !!pendingMutations.length;

  pendingMutations.push(mutation);

  if (!isFirstMutationInBatch) {
    // Schedule sending the mutations to the main thread.
    setTimeout(sendMutations);
  }
};

const sendMutations = () => {
  // Splice call copies the pendingMutations array and empties it.
  const mutations = pendingMutations.splice(0);

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

new DomMutationObserver({
  Node: {
    // No need to wrap appendChild because it just calls through to insertBefore internally.
    // TODO: see if we need to wrap replaceChild.
    insertBefore(child, ref, origMethod) {
      const ret = origMethod(child, ref);

      collectMutation({
        target: this,
        type: 'childList',
        addedNodes: [child],
        previousSibling: ref,
      });
      
      return ret;
    },
    removeChild(child, origMethod) {
      const i = this.childNodes.indexOf(child);
      if (i > -1) {
        collectMutation({
          target: this,
          type: 'childList',
          removedNodes: [child],
          previousSibling: this.childNodes[i - 1],
          nextSibling: this.childNodes[i],
        });
      }

      return origMethod(child);
    },
  },

  Element: {
    // setAttribute and removeAttribute aren't needed because undom calls the NS versions of these internally.
    setAttributeNS(ns, name, value, origMethod) {
      collectMutation({
        target: this,
        type: 'attributes',
        attributeName: name,
        attributeNamespace: ns,
      });

      return origMethod(ns, name, value);
    },
    removeAttributeNS(ns, name, origMethod) {
      collectMutation({
        target: this,
        type: 'attributes',
        attributeName: name,
        attributeNamespace: ns,
      });

      return origMethod(ns, name);
    },
  },
}).start();

// Preact reads and sets the `data` property on text nodes internally,
// whilst undom uses the `textContent` property. As such we alias the
// `data` property to `textContent` so that Preact and undom play nicely
// together.
Object.defineProperty(
  document.defaultView.Text.prototype,
  'data',
  {
    get() {
      return this.nodeValue;
    },
    set(value) {
      collectMutation({
        target: this,
        type: 'characterData',
      });
      this.nodeValue = value;
    }
  }
);
