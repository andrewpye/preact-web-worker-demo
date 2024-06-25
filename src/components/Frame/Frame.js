// This is a copy of react-frame-component@4.1.3 modified to use Preact
// things explicitly since getting preact-compat from CDN doesn't work.
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';
import { Component, createElement, render } from 'https://unpkg.com/preact@latest?module';

// createPortal copied from preact-compat (GH: preact@10.22.0 -> compat) because importing it from CDN doesn't work.
function ContextProvider(props) {
  this.getChildContext = () => props.context;
  return props.children;
}

function Portal(props) {
  const _this = this;
  let container = props._container;

  _this.componentWillUnmount = function () {
    render(null, _this._temp);
    _this._temp = null;
    _this._container = null;
  };

  // When we change container we should clear our old container and
  // indicate a new mount.
  if (_this._container && _this._container !== container) {
    _this.componentWillUnmount();
  }

  if (!_this._temp) {
    _this._container = container;

    // Create a fake DOM parent node that manages a subset of `container`'s children:
    _this._temp = {
      nodeType: 1,
      parentNode: container,
      childNodes: [],
      appendChild(child) {
        this.childNodes.push(child);
        _this._container.appendChild(child);
      },
      insertBefore(child, before) {
        this.childNodes.push(child);
        _this._container.appendChild(child);
      },
      removeChild(child) {
        this.childNodes.splice(this.childNodes.indexOf(child) >>> 1, 1);
        _this._container.removeChild(child);
      }
    };
  }

  // Render our wrapping element into temp.
  render(
    createElement(ContextProvider, { context: _this.context }, props._vnode),
    _this._temp
  );
}

function createPortal(vnode, container) {
  const el = createElement(Portal, { _vnode: vnode, _container: container });
  el.containerInfo = container;
  return el;
}

import { FrameContextProvider } from './Context.js';
import Content from './Content.js';

export default class Frame extends Component {
  constructor(props, context) {
    super(props, context);
    this._isMounted = false;
  }

  get props() {
    return this._props;
  }

  set props(value) {
    const defaultProps = {
      style: {},
      head: null,
      children: undefined,
      mountTarget: undefined,
      contentDidMount: () => {},
      contentDidUpdate: () => {},
      initialContent:
        '<!DOCTYPE html><html><head></head><body><div class="frame-root"></div></body></html>'
    };

    this._props = {
      ...defaultProps,
      ...value,
    };
  }

  componentDidMount() {
    this._isMounted = true;

    const doc = this.getDoc();
    if (doc && doc.readyState === 'complete') {
      this.forceUpdate();
    } else {
      this.node.addEventListener('load', this.handleLoad);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.node.removeEventListener('load', this.handleLoad);
  }

  getDoc() {
    return this.node ? this.node.contentDocument : null;
  }

  getMountTarget() {
    const doc = this.getDoc();
    if (this.props.mountTarget) {
      return doc.querySelector(this.props.mountTarget);
    }
    return doc.body.children[0];
  }

  handleLoad = () => {
    this.forceUpdate();
  };

  renderFrameContents() {
    if (!this._isMounted) {
      return null;
    }

    const doc = this.getDoc();

    if (!doc) {
      return null;
    }

    const contentDidMount = this.props.contentDidMount;
    const contentDidUpdate = this.props.contentDidUpdate;

    const win = doc.defaultView || doc.parentView;

    const contents = html`
      <${Content}
        contentDidMount=${contentDidMount}
        contentDidUpdate=${contentDidUpdate}
      >
        <${FrameContextProvider} value=${{ document: doc, window: win }}>
          <div className="frame-content">${this.props.children}</div>
        </>
      </>
    `;

    if (doc.body.children.length < 1) {
      doc.open('text/html', 'replace');
      doc.write(this.props.initialContent);
      doc.close();
    }

    const mountTarget = this.getMountTarget();

    return [
      createPortal(this.props.head, this.getDoc().head),
      createPortal(contents, mountTarget)
    ];
  }

  render() {
    const props = {
      ...this.props,
      children: undefined // The iframe isn't ready so we drop children from props here. #12, #17
    };
    delete props.head;
    delete props.initialContent;
    delete props.mountTarget;
    delete props.contentDidMount;
    delete props.contentDidUpdate;
    return html`
      <iframe
        ...${props}
        ref=${(node) => {
          this.node = node;
        }}
      >
        ${this.renderFrameContents()}
      </iframe>
    `
  }
}
