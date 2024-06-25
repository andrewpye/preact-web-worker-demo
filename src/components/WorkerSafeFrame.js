import Frame from './Frame/Frame.js';

export default class WorkerSafeFrame extends Frame {
  _hasWrittenInitialContent = false;

  getMountTarget() {
    // Fall back to the body since initial content that would be written
    // via document.write() won't be written in the worker.
    return super.getMountTarget() ?? this.getDoc().body;
  }

  renderFrameContents() {
    if (this._hasWrittenInitialContent) {
      return super.renderFrameContents();
    }

    // Run the document.write() call, but because we're sending it to the main thread
    // it's async so we wait until that completes before we call the super.
    this._writeInitialContent();
  }

  async _writeInitialContent() {
    if (!this._isMounted) {
      return;
    }

    const doc = this.getDoc();
    if (!doc) {
      return;
    }

    if (doc.body.children.length < 1) {
      await doc.write(this.props.initialContent); // async polyfill because we have to post to the main thread.

      // Stub document.write calls to prevent the base class getting stuck in
      // a loop where it calls renderFrameContents and we end up here again.
      doc.write = function() {};
    }

    this._hasWrittenInitialContent = true;
    this.renderFrameContents();
  }
};
