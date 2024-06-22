import undom from 'https://unpkg.com/undom@latest?module';

const createVirtualDom = (documentParent = globalThis) => {
  documentParent.document = undom();
};

export default createVirtualDom;
