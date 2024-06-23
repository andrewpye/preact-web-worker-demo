import { useCallback, useEffect, useRef, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';

const Counter = () => {
  const timerRef = useRef(null);
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const start = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCount((c) => c + 1);
    }, 1_000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (isRunning) {
      start();
      return () => stop();
    }

    stop();
  }, [isRunning]);

  return html`
    <div data-count=${count}>
      Count: ${count}
    </div>

    <!-- 
      Probably something to do with htm, but the event name has to be
      lower-case for Preact to run the event handler without throwing.
    -->
    <button onclick=${() => setIsRunning((r) => !r)}>
      ${isRunning ? 'Stop' : 'Start'}
    </button>
  `;
};

export default Counter;
