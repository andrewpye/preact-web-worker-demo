import undom from 'https://unpkg.com/undom@latest?module';
import shimIFrameCreation from './shimIFrameCreation.js';

const createVirtualDom = (documentParent = globalThis) => {
  documentParent.document = undom();

  shimIFrameCreation();
};

export default createVirtualDom;
