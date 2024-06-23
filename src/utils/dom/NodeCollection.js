export default class NodeCollection {
  constructor() {
    this._nodes = new Set();
    this._nodesCount = 0;
  }

  add(node) {
    if (node._id) {
      return;
    }

    node._id = String(++this._nodesCount);
    this._nodes[node._id] = node;
  }
}
