const upperCaseFirstChar = (str) => str[0].toUpperCase() + str.slice(1);

export default class DomMutationHandler {
  constructor({ container }) {
    this._container = container;
    this._nodes = new Map();
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

    if (vNode.nodeName === 'BODY') {
      // Worker renders into the virtual body. Returning the container node instead
      // allows the consuming app to specify where the worker's output is rendered.
      return this._container;
    }

    let node = this._nodes.get(vNode._id);
    if (!node) {
      node = this._createNode(vNode);
      this._nodes.set(vNode._id, node);
    }

    return node;
  }

  _createNode(vNode) {
    let node;
    if (vNode.nodeType === 3) {
      node = document.createTextNode(vNode.nodeValue);
    }
    else if (vNode.nodeType === 1) {
      node = document.createElement(vNode.nodeName);
  
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
        node.appendChild(this._createNode(child));
      });
    }
  
    // This internal ID allows us to map virtual nodes from the
    // worker to the corresponding DOM nodes in the main thread.
    node._id = vNode._id;
    this._nodes.set(vNode._id, node);
  
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
}
