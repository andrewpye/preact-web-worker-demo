export default class MethodWrapper {
  _originalMethods = {};

  constructor(Class, overrides) {
    this.Class = Class;
    this.overrides = overrides;

    this._wrapMethods();
  }

  destroy() {
    this._unwrapMethods();
  }

  _wrapMethods() {
    for (const methodName in this.overrides) {
      this._wrapMethod(methodName, this.overrides[methodName]);
    }
  }

  _wrapMethod(methodName, wrapperFactory) {
    const proto = this.Class.prototype;
    const originalMethod = proto[methodName];

    this._originalMethods[methodName] = originalMethod;

    proto[methodName] = wrapperFactory(originalMethod);
  }

  _unwrapMethods() {
    const proto = this.Class.prototype;

    for (const methodName in this.overrides) {
      proto[methodName] = this._originalMethods[methodName];
    }
  }
}
