import { useCallback, useRef, useState } from 'react';

// The shared request-in-flight control: while an async action's request is
// in flight, the button is disabled and shows progress text, so a second
// click cannot start a duplicate request. This is UI-side duplicate-control
// for this tab's own clicks only; it does not and cannot make a repeated
// HTTP request safe on the server — that is the backend's database-level
// idempotency job (for checkout, the unique (diner, checkout_key) pair).

// Hook form for screens that need to drive their own in-flight flag.
export function useAsyncAction(runner) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(
    async (...args) => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      setBusy(true);
      try {
        return await runner(...args);
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [runner],
  );

  return { busy, run };
}

// Button form: wrap onClick and the click handler itself refuses to start a
// second request while one is in flight.
export default function AsyncButton({
  label,
  busyLabel = 'Working…',
  onClick,
  busy = false,
  disabled = false,
  type = 'button',
  className = 'btn btn-primary',
  ...rest
}) {
  const [internalBusy, setInternalBusy] = useState(false);
  const inFlight = useRef(false);
  const isBusy = busy || internalBusy;

  const handleClick = useCallback(
    async (event) => {
      if (inFlight.current || isBusy || disabled || !onClick) return;
      inFlight.current = true;
      setInternalBusy(true);
      try {
        await onClick(event);
      } finally {
        inFlight.current = false;
        setInternalBusy(false);
      }
    },
    [onClick, isBusy, disabled],
  );

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || isBusy}
      onClick={handleClick}
      {...rest}
    >
      {isBusy ? busyLabel : label}
    </button>
  );
}
