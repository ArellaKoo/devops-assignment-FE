import { useCallback, useRef, useState } from 'react';

// Shows the shared refusal banner only when a load transitions to an error
// state, so a persistent failure under 3-second polling is not repeated as a
// new banner on every tick. A fresh refusal after a successful load still
// surfaces, and the next successful load resets the state.
export default function useTransitionError(show) {
  const state = useRef('idle');
  const [message, setMessage] = useState(null);

  const markOk = useCallback(() => {
    state.current = 'ok';
    setMessage(null);
  }, []);

  const markError = useCallback((nextMessage) => {
    setMessage(nextMessage);
    if (state.current !== 'error') {
      state.current = 'error';
      show(nextMessage, 'danger');
    }
  }, [show]);

  return {
    message,
    markOk,
    markError,
  };
}
