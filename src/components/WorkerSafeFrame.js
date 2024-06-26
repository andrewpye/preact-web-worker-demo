import Frame from './Frame/Frame.js';
import NodeSerialiser from '../utils/dom/NodeSerialiser.js';

export default class WorkerSafeFrame extends Frame {
  _hasInsertedInitialContent = false;

  // Override the base class's method to prevent it from calling document.write
  // because it's not implemented in undom's Document class. Once we've inserted
  // the content ourselves, we'll call through to the base class's implementation.
  renderFrameContents() {
    if (this._hasInsertedInitialContent) {
      return super.renderFrameContents();
    }

    this._insertInitialContent();
  }

  async _insertInitialContent() {
    const doc = this.getDoc();
    if (!doc) {
      return;
    }

    const tree = await this._parse(this.props.initialContent);

    const docElement = NodeSerialiser.deserialiseNode(tree, doc);

    // Rebuild the document's contents from the parsed HTML.
    doc.documentElement = docElement;

    const childNodes = doc.documentElement.childNodes;
    doc.head = childNodes.find((n) => n.nodeName === 'HEAD');
    doc.body = childNodes.find((n) => n.nodeName === 'BODY');

    this._hasInsertedInitialContent = true;

    // Trigger a re-render to flush the real frame contents to the virtual DOM.
    this.forceUpdate();
  }

  _parse(html) {
    return new Promise((resolve) => {
      const onHtmlParsed = ({ data }) => {
        if (data.type !== 'htmlParsed') {
          return;
        }

        removeEventListener('message', onHtmlParsed);

        resolve(data.tree);
      };

      addEventListener('message', onHtmlParsed);
      postMessage({
        type: 'parseHtml',
        text: html,
      });
    });
  }
};
