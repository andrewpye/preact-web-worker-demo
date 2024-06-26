export default class NodeSerialiser {
  static serialiseNode(node) {
    return JSON.stringify(
      this._convertElementToObject(node)
    );
  }

  static deserialiseNode(str, doc) {
    return this._convertObjectToElement(
      JSON.parse(str),
      doc
    );
  }

  static _convertElementToObject(e) {
    return {
      nodeName: e.nodeName,
      nodeType: e.nodeType,
      nodeValue: e.nodeValue,
      attributes: [...e.attributes].map(({ name, value }) => ({ name, value })),
      childNodes: [...e.childNodes].map(NodeSerialiser._convertElementToObject),
    };
  }

  static _convertObjectToElement(o, d) {
    let e;
    if (o.nodeType === 3) {
      e = d.createTextNode(o.nodeValue);
    }
    else if (o.nodeType === 1) {
      e = d.createElement(o.nodeName);

      o.attributes.forEach(({ name, value }) => {
        e.setAttribute(name, value);
      });

      o.childNodes.forEach((child) => {
        e.appendChild(NodeSerialiser._convertObjectToElement(child, d));
      });
    }

    return e;
  }
}
