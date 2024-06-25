export default class NodeCollection {
  constructor() {
    this._nodes = new Map();
    this._nodesCount = 0;
  }

  add(node) {
    if (node._id) {
      return;
    }

    this._add(node);

    if (node.nodeName === 'IFRAME') {
      this._add(node.contentDocument);
    }
  }

  get(node) {
    let id;
    if (node && typeof node === 'object') {
      id = node._id;
    }
    else if (typeof node === 'string') {
      id = node;
    }

    return id ? this._nodes.get(id) : null;
  }

  _add(node) {
    const id = String(++this._nodesCount);
    node._id = id;
    this._nodes.set(id, node);
  }
}
