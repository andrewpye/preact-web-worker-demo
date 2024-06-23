import initialiseVirtualDom from './initialiseVirtualDom.js';

export default class WorkerisedRenderer {
  constructor(render) {
    this._render = render;

    this._initialise();
  }

  _initialise() {
    initialiseVirtualDom();

    this._render();
  }
}
