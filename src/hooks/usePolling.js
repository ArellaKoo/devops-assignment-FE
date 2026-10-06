import { useEffect, useRef } from 'react';

// Polls `fn` every `intervalMs` while `active` is true.
// Runs once immediately, skips a tick if the previous request is still in
// flight, and clears the timer on unmount (or when `active` goes false), so
// an active menu/order view stops updating the moment the diner leaves it.
// History views never poll — they simply do not call this hook.
export default function usePolling(fn, intervalMs, active = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!active || intervalMs <= 0) return undefined;
    let inFlight = false;
    const tick = () => {
      if (inFlight) return;
      inFlight = true;
      Promise.resolve()
        .then(() => fnRef.current())
        .finally(() => {
          inFlight = false;
        });
    };
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, active]);
}
