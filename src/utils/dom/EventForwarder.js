export default class EventForwarder {
  constructor(target, onEvent) {
    this._target = target;
    this._onEvent = onEvent;

    this._touchData = null;

    this._initEventForwarding();
  }

  _initEventForwarding() {
    const target = this._target;

    let supportsPassive = false;
    try {
      target.addEventListener('test', null, {
        get passive() { supportsPassive = true; }
      });
    } catch (e) {}

    const eventOptions = supportsPassive ? {
      capture: true,
      passive: true,
    } : true;

    const eventsToIgnore = [
      'mousewheel',
      'wheel',
      'animationstart',
      'animationiteration',
      'animationend',
      'devicemotion',
      'deviceorientation',
      'deviceorientationabsolute',
      'unload', // triggers deprecation warning
    ];

    // Loop over all "on*" event names on target object and set up a proxy handler for each.
    for (let propName in target) {
      const eventName = propName.substring(2);
      if (
        propName.substring(0,2) === 'on' &&
        propName === propName.toLowerCase() &&
        eventsToIgnore.indexOf(eventName) < 0 &&
        (target[propName] === null || typeof target[propName] === 'function')
      ) {
        target.addEventListener(eventName, (e) => this._forwardEvent(e), eventOptions);
      }
    }
  }

  _forwardEvent(event) {
    if (event.type === 'click' && this._touchData) {
      return false;
    }

    const serialisableEvent = this._getSerialisableCopy(event);

    this._sendEvent(serialisableEvent);

    this._handleTouchEvent(event, serialisableEvent);
  }

  _handleTouchEvent(event, serialisableEvent) {
    if (event.type === 'touchstart') {
      this._touchData = this._getTouchDataFromEvent(event);
    }
    else if (event.type === 'touchend' && this._touchData) {
      let touchData = this._getTouchDataFromEvent(event);
      if (touchData) {
        const delta = Math.sqrt(
          Math.pow(touchData.pageX - this._touchData.pageX, 2) +
          Math.pow(touchData.pageY - this._touchData.pageY, 2)
        );

        if (delta < 10) {
          serialisableEvent.type = 'click';
          this._sendEvent(serialisableEvent);
        }
      }
    }
  }

  _getTouchDataFromEvent(event) {
    let touchData = event.changedTouches?.[0] ||
      event.touches?.[0] ||
      event;
		return touchData ? { pageX: touchData.pageX, pageY: touchData.pageY } : null;
  }

  _getSerialisableCopy(event) {
    const serialisableEvent = { type: event.type };

    if (event.target) {
      serialisableEvent.target = event.target._id;
    }

    for (let propName in event) {
      let value = event[propName];
      if (
        typeof value !== 'object' &&
        typeof value !== 'function' &&
        propName !== propName.toUpperCase()
        && !serialisableEvent.hasOwnProperty(propName)
      ) {
        serialisableEvent[propName] = value;
      }
    }

    return serialisableEvent;
  }

  _sendEvent(event) {
    this._onEvent(event);
  }
}
