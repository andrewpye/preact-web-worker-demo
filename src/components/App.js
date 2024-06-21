import { useEffect } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';

const nodes = new Map();
const pendingMutations = [];
let containerNode;

// Retrieves or creates a DOM node for a given virtual DOM node in the worker.
const getNode = (vNode) => {
	if (!vNode) {
		return null;
	}

	if (vNode.nodeName === 'BODY') {
		return containerNode;
	}

	let node = nodes.get(vNode._id);
	if (!node) {
		node = createNode(vNode);
		nodes.set(vNode._id, node);
	}

	return node;
};

const createNode = (vNode) => {
	let node;
	if (vNode.nodeType === 3) {
		node = document.createTextNode(vNode.nodeValue);
	}
	else if (vNode.nodeType === 1) {
		node = document.createElement(vNode.nodeName);

		if (vNode.className) {
			node.className = vNode.className;
		}

		if (vNode.style) {
			Object.keys(vNode.style).forEach((key) => {
				if (vNode.style.hasOwnProperty(key)) {
					node.style[key] = vNode.style[key];
				}
			});
		}

		vNode.attributes?.forEach(({ name, value }) => {
			node.setAttribute(name, value);
		});

		vNode.childNodes?.forEach((child) => {
			node.appendChild(createNode(child));
		});
	}

	node._id = vNode._id;
	nodes.set(vNode._id, node);

	return node;
};

const queueMutation = (mutation) => {
	// For single-node updates, merge into pending updates.
	if (mutation.type === 'characterData' || mutation.type ===' attributes') {
		for (let i = pendingMutations.length; i--; ) {
			let m = pendingMutations[i];
			if (m.type === mutation.type && m.target._id === mutation.target._id) {
				if (m.type === 'attributes') {
					pendingMutations.splice(i + 1, 0, mutation);
				} else {
					pendingMutations[i] = mutation;
				}

				return;
			}
		}
	}

	if (pendingMutations.push(mutation) === 1) {
		processMutationQueue();
	}
};

const processMutationQueue = () => {
	// TODO: add timing optimisation a la https://github.com/developit/preact-worker-demo/blob/bac36d7c34b241e4c041bcbdefaef77bcc5f367e/src/renderer/dom.js#L232.
	for (let i = 0; i < pendingMutations.length; i++) {
		const mutation = pendingMutations.splice(i--, 1)[0];
		processMutation(mutation);
	}
};

const MUTATION_HANDLERS = {
	childList({ target, removedNodes, addedNodes, nextSibling }) {
		let parent = getNode(target);

		removedNodes?.reverse().forEach((node) => {
			parent.removeChild(getNode(node));
		});

		addedNodes?.forEach((node) => {
			parent.insertBefore(getNode(node), getNode(nextSibling));
		});
	},

	attributes({ target, attributeName }) {
		const value = target.attributes.find((attr) => attr.name === attributeName)?.value;

		getNode(target).setAttribute(attributeName, value);
	},

	characterData({ target }) {
		getNode(target).nodeValue = target.nodeValue;
	},
};

const processMutation = (mutation) => {
	MUTATION_HANDLERS[mutation.type](mutation);
};

export default ({ container = document.body }) => {
	useEffect(() => {
		containerNode = container;
		const worker = new Worker('/src/workers/main.js', { type: 'module' });

		worker.onmessage = ({ data }) => {
			if (data.type === 'domMutations') {
				data.mutations.forEach(queueMutation);
			}
		};

		return () => {
			worker.terminate();
		};
	}, []);

	return null; // Content will be populated on receiving messages from worker.
};
