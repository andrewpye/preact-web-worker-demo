import Frame from './Frame/Frame.js';

export default class WorkerSafeFrame extends Frame {
  _hasWrittenInitialContent = false;

  renderFrameContents() {
    if (this._hasWrittenInitialContent) {
      return super.renderFrameContents();
    }

    // Populating the initial content here prevents the base class from attempting
    // to call document.write (which isn't implemented in undom's Document class).
    this._writeInitialContent();
  }

  async _writeInitialContent() {
    const doc = this.getDoc();
    if (!doc) {
      return;
    }

    await new Promise((resolve) => {
      const onHtmlParsed = ({ data }) => {
        if (data.type !== 'htmlParsed') {
          return;
        }

        removeEventListener('message', onHtmlParsed);

        // TODO: extract this to a reusable utility and maybe DRY up with element creation in DomMutationHandler.
        const convertObjectToElement = (o, d) => {
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
              e.appendChild(convertObjectToElement(child, d));
            });
          }

          return e;
        };

        // Rebuild the document's contents from the parsed HTML.
        doc.documentElement = convertObjectToElement(JSON.parse(data.tree), doc);

        const childNodes = doc.documentElement.childNodes;
        doc.head = childNodes.find((n) => n.nodeName === 'HEAD');
        doc.body = childNodes.find((n) => n.nodeName === 'BODY');

        resolve();
      };

      addEventListener('message', onHtmlParsed);
      postMessage({
        type: 'parseHtml',
        text: this.props.initialContent,
      });
    });

    this._hasWrittenInitialContent = true;

    // Trigger a re-render to flush the real frame contents to the virtual DOM.
    this.forceUpdate();
  }
};
