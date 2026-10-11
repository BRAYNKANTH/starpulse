import { useCallback, useRef, useState } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const dismiss = useCallback(id => setToasts(current => current.filter(toast => toast.id !== id)), []);
  const notify = useCallback((message, tone = 'success') => {
    const id = ++nextId.current;
    setToasts(current => [...current.slice(-2), { id, message, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
  }, [dismiss]);
  return { toasts, notify, dismiss };
}
