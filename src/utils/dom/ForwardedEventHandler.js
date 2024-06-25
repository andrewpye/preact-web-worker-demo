export default class ForwardedEventHandler {
  constructor(nodeCollection) {
    this._nodeCollection = nodeCollection;
  }

  handleEvent(event) {
    let target = this._nodeCollection.get(event.target);

    while (!target?.dispatchEvent) {
      target = target?.parentNode;

      if (!target) {
        return;
      }
    }

    target.dispatchEvent({
      ...event,
      target,
      bubbles: true,
    });
  }
}
