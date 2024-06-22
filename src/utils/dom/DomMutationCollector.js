export default class DomMutationCollector {
  _pendingMutations = [];

  constructor(onDomMutationsAdded) {
    this._onDomMutationsAdded = onDomMutationsAdded;
  }

  collectMutation(mutation) {
    const isFirstMutationInBatch = !!this._pendingMutations.length;
  
    this._pendingMutations.push(mutation);
  
    if (!isFirstMutationInBatch) {
      // Using setTimeout allows us to collect all mutations from
      // the currently-executing task before invoking the callback,
      // so we can emit mutations in batches instead of one by one.
      setTimeout(() => {
        // Splice call copies the array and empties it ready for the next batch.
        const mutations = this._pendingMutations.splice(0);
        this._onDomMutationsAdded(mutations);
      });
    }
  }
}
