export default class DomMutationObserver {
  constructor(mutators) {
    this.mutators = mutators || {};
  }

  start() {
    Object.keys(this.mutators).forEach((className) => {
      const Class = document.defaultView[className];
      const proto = Class.prototype;
      const methods = this.mutators[className];

      Object.keys(this.mutators[className]).forEach((methodName) => {
        const origMethod = Class.prototype[methodName];
        const callback = methods[methodName];

        proto[methodName] = function () {
          return callback.call(this, ...arguments, origMethod.bind(this));
        }
      });
    });
  };
}
