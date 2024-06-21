import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { html } from 'https://unpkg.com/htm/preact/index.module.js?module';

const Counter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return html`<div data-count=${count}>Count: ${count}</div>`;
};

export default Counter;
