import MethodWrapper from '../class/MethodWrapper.js';

const hookDomMutations = (onDomMutation) => {
  // No need to wrap appendChild because undom's implementation just calls through to insertBefore internally.
  // TODO: see if we need to wrap replaceChild.
  const nodeWrapper = new MethodWrapper(document.defaultView.Node, {
    insertBefore(origMethod) {
      return function wrappedInsertBefore(child, ref) {
        const ret = origMethod.call(this, child, ref);

        onDomMutation({
          target: this,
          type: 'childList',
          addedNodes: [child],
          previousSibling: ref,
        });
        
        return ret;
      };
    },

    removeChild(origMethod) {
      return function wrappedRemoveChild(child) {
        const i = this.childNodes.indexOf(child);

        if (i > -1) {
          onDomMutation({
            target: this,
            type: 'childList',
            removedNodes: [child],
            previousSibling: this.childNodes[i - 1],
            nextSibling: this.childNodes[i],
          });
        }

        return origMethod.call(this, child);
      };
    }
  });

  const elementWrapper = new MethodWrapper(document.defaultView.Element, {
    setAttributeNS(origMethod) {
      return function wrappedSetAttributeNS(ns, name, value) {
        onDomMutation({
          target: this,
          type: 'attributes',
          attributeName: name,
          attributeNamespace: ns,
        });

        return origMethod.call(this, ns, name, value);
      };
    },

    removeAttributeNS(origMethod) {
      return function wrappedRemoveAttributeNS(ns, name) {
        onDomMutation({
          target: this,
          type: 'attributes',
          attributeName: name,
          attributeNamespace: ns,
        });

        return origMethod.call(this, ns, name);
      };
    }
  });

  return () => {
    elementWrapper.destroy();
    nodeWrapper.destroy();
  };
};

export default hookDomMutations;
