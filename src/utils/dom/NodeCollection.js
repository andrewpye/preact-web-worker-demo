export default class NodeCollection {
  constructor() {
    this._nodes = new Map();
    this._nodesCount = 0;
  }

  add(node) {
    if (node._id) {
      return;
    }

    const id = String(++this._nodesCount);
    node._id = id;
    this._nodes.set(id, node);
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
}
