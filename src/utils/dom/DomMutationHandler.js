const upperCaseFirstChar = (str) => str[0].toUpperCase() + str.slice(1);

export default class DomMutationHandler {
  constructor({ container, nodes, onNodeFirstSeen }) {
    this._container = container;
    this._nodes = nodes;
    this._onNodeFirstSeen = onNodeFirstSeen;

    this._pendingMutations = [];
  }

  processMutations(mutations) {
    mutations.forEach((mutation) => this._queueMutation(mutation));
  }

  // Retrieves or creates a DOM node for a given virtual DOM node in the worker.
  _getNode(vNode) {
    if (!vNode) {
      return null;
    }

    let node = this._nodes.get(vNode._id);

    if (node) {
      return node;
    }

    // Some nodes are created before rendering the virtual DOM into the main DOM.
    // For those special cases, we need to look up the node and associate it with
    // the virtual node's ID.
    switch (vNode.nodeName) {
      case '#document':
        // Only happens for iframe document.
        node = this._nodes.get(vNode.ownerFrameId).contentDocument;
        break;

      case 'HTML':
        // Only happens for iframe content.
        node = this._getOwnerDocument(vNode).documentElement;
        break;

      case 'HEAD':
        // Only happens for iframe content.
        node = this._getOwnerDocument(vNode).head;
        break;

      case 'BODY':
        // Worker renders unframed content into the virtual body. Returning the container node
        // instead allows the consuming app to specify where the worker's output is rendered.
        node = vNode.ownerDocumentId ? this._getOwnerDocument(vNode).body : this._container;
        break;

      default:
        node = this._createNode(vNode);
    }

    node._id = vNode._id;
    this._onNodeFirstSeen(node);

    return node;
  }

  _getOwnerDocument(node) {
    return node.ownerDocumentId ?
      this._nodes.get(node.ownerDocumentId) :
      document;
  }

  _createNode(vNode) {
    let node;
    const doc = this._getOwnerDocument(vNode);

    if (vNode.nodeType === 3) {
      node = doc.createTextNode(vNode.nodeValue);
    }
    else if (vNode.nodeType === 1) {
      node = doc.createElement(vNode.nodeName);
  
      if (vNode.className) {
        node.className = vNode.className;
      }
  
      if (vNode.style) {
        Object.keys(vNode.style).forEach((key) => {
          if (vNode.style.hasOwnProperty(key)) {
            node.style[key] = vNode.style[key];
          }
        });
      }
  
      vNode.attributes?.forEach(({ name, value }) => {
        node.setAttribute(name, value);
      });
  
      vNode.childNodes?.forEach((child) => {
        node.appendChild(this._getNode(child));
      });
    }
  
    return node;
  }

  _queueMutation(mutation) {
    const pendingMutations = this._pendingMutations;
    // For single-node updates, merge into pending updates.
    if (mutation.type === 'characterData' || mutation.type ===' attributes') {
      for (let i = pendingMutations.length; i--; ) {
        let m = pendingMutations[i];
        if (m.type === mutation.type && m.target._id === mutation.target._id) {
          if (m.type === 'attributes') {
            pendingMutations.splice(i + 1, 0, mutation);
          } else {
            pendingMutations[i] = mutation;
          }
  
          return;
        }
      }
    }
  
    if (pendingMutations.push(mutation) === 1) {
      this._processMutationQueue();
    }
  }

  _processMutationQueue() {
    const pendingMutations = this._pendingMutations;
    // TODO: add timing optimisation a la https://github.com/developit/preact-worker-demo/blob/bac36d7c34b241e4c041bcbdefaef77bcc5f367e/src/renderer/dom.js#L232.
    for (let i = 0; i < pendingMutations.length; i++) {
      const mutation = pendingMutations.splice(i--, 1)[0];
      this._processMutation(mutation);
    }
  }

  _processMutation(mutation) {
    this[`_process${upperCaseFirstChar(mutation.type)}Mutation`](mutation);
  }

  _processChildListMutation({ target, removedNodes, addedNodes, nextSibling }) {
    let parent = this._getNode(target);

    removedNodes?.reverse().forEach((node) => {
      parent.removeChild(this._getNode(node));
    });

    addedNodes?.forEach((node) => {
      if (this._isPreCreatedNode(node)) {
        // TODO: do we need merge node into existing node (e.g. if frame initial content adds attributes to body)?
        return;
      }

      parent.insertBefore(this._getNode(node), this._getNode(nextSibling));
    });
  }

  _processAttributesMutation({ target, attributeName }) {
    const value = target.attributes.find((attr) => attr.name === attributeName)?.value;

    this._getNode(target).setAttribute(attributeName, value);
  }

  _processCharacterDataMutation({ target }) {
    this._getNode(target).nodeValue = target.nodeValue;
  }

  _isPreCreatedNode({ nodeName }) {
    return ['#document', 'HTML', 'HEAD', 'BODY',].includes(nodeName);
  }
}
