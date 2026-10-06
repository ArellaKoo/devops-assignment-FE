import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

// Shared actionable feedback: pages report the backend's refusal message
// (ApiError.message) here and the persona layout's FeedbackBanner shows it,
// so a refusal always lands on the screen that made the request.

const FeedbackContext = createContext(null);
let nextId = 1;

function reducer(items, action) {
  switch (action.type) {
    case 'push':
      return [...items, { id: nextId++, kind: action.kind, message: action.message }];
    case 'dismiss':
      return items.filter((item) => item.id !== action.id);
    default:
      return items;
  }
}

export function FeedbackProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, []);

  const show = useCallback((message, kind = 'danger') => {
    dispatch({ type: 'push', kind, message });
  }, []);

  const dismiss = useCallback((id) => {
    dispatch({ type: 'dismiss', id });
  }, []);

  const value = useMemo(() => ({ items, show, dismiss }), [items, show, dismiss]);
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return context;
}
