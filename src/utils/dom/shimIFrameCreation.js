// Wrap document.createElement and document.createElementNS to create a virtual document on iframes.
const shimIFrameCreation = () => {
  const createDocumentForIFrame = (el) => {
    if (el.nodeName !== 'IFRAME' || !!el.document) {
      return;
    }

    // Initialise a new virtual document for the frame.
    const doc = new document.Document();

    // Copy required properties (not on prototype) from top-level document.
    [
      'createElement',
      'createElementNS',
      'createTextNode',
      'Document',
      'Node',
      'Text',
      'Element',
      /* SVGElement: Element */,
      'Event',
    ].forEach((propName) => {
      doc[propName] = document[propName];
    });

    // Wrap node creation methods to associate the created node with the document.
    // This allows the main thread to find the correct document for the node.
    [
      'createElement',
      'createElementNS',
      'createTextNode',
    ].forEach((methodName) => {
      const origMethod = doc[methodName];
      doc[methodName] = function(...args) {
        const el = origMethod.apply(this, args);
        el.ownerDocument = this;
        return el;
      };
    });

    doc.ownerFrame = el;

    // Wrapping this in a setTimeout allows the iframe creation to have been
    // passed to the main thread before we start manipulating it. Otherwise,
    // we have no way of associating the document with its frame in the main
    // thread.
    setTimeout(() => {
      const docElement = doc.createElement('html');
      doc.documentElement = docElement;
      doc.appendChild(docElement);
      docElement.appendChild(doc.head = doc.createElement('head'));
      docElement.appendChild(doc.body = doc.createElement('body'));

      el.document = el.contentDocument = doc;
    });
  };

  [
    'createElement',
    'createElementNS',
  ].forEach((methodName) => {
    const origMethod = document[methodName];
    document[methodName] = function(...args) {
      const el = origMethod.apply(this, args);
      createDocumentForIFrame(el);
      return el;
    };
  });
};

export default shimIFrameCreation;
