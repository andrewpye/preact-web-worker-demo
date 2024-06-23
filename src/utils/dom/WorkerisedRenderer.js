import createVirtualDom from './createVirtualDom.js';
import DomMutationCollector from './DomMutationCollector.js';
import DomMutationMessagePoster from './DomMutationMessagePoster.js';
import hookDomMutations from './hookDomMutations.js';
import hookTextContentChanges from './hookTextContentChanges.js';

export default class WorkerisedRenderer {
  constructor(render) {
    this._render = render;

    this._domMutationMessagePoster = new DomMutationMessagePoster();

    this._domMutationCollector = new DomMutationCollector((mutations) => {
      this._domMutationMessagePoster.sendMutations(mutations);
    });

    this.collectMutation = this.collectMutation.bind(this);
    
    this._initialise();
  }
  
  _initialise() {
    createVirtualDom();

    hookDomMutations(this.collectMutation);
    hookTextContentChanges(this.collectMutation);

    this._render();
  }

  collectMutation(...args) {
    this._domMutationCollector.collectMutation(...args);
  };
}
