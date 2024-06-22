// Preact reads and sets the `data` property on text nodes internally,
// whilst undom uses the `textContent` property. As such we alias the
// `data` property to `textContent` so that Preact and undom play nicely
// together.
export default function hookTextContentChanges (onTextContentChanged) {
  Object.defineProperty(
    document.defaultView.Text.prototype,
    'data',
    {
      get() {
        return this.nodeValue;
      },
      set(value) {
        onTextContentChanged({
          target: this,
          type: 'characterData',
        });
        this.nodeValue = value;
      }
    }
  );
};
