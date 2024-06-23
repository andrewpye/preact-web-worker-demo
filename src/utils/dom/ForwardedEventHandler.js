export default class ForwardedEventHandler {
  constructor(nodeCollection) {
    this._nodeCollection = nodeCollection;
  }

  handleEvent(event) {
    const target = this._nodeCollection.get(event.target);

    target?.dispatchEvent({
      ...event,
      target,
      bubbles: true,
    });
  }
}
