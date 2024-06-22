import createVirtualDom from './createVirtualDom.js';
import DomMutationCollector from './DomMutationCollector.js';
import DomMutationMessagePoster from './DomMutationMessagePoster.js';
import hookDomMutations from './hookDomMutations.js';
import hookTextContentChanges from './hookTextContentChanges.js';

const initialiseVirtualDom = () => {
  const domMutationMessagePoster = new DomMutationMessagePoster();

  const domMutationCollector = new DomMutationCollector((mutations) => {
    domMutationMessagePoster.sendMutations(mutations);
  });

  const collectMutation = (...args) => { domMutationCollector.collectMutation(...args); };

  createVirtualDom();

  hookDomMutations(collectMutation);
  hookTextContentChanges(collectMutation);
};

export default initialiseVirtualDom;
