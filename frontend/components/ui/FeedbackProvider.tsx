'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Toast } from './Toast';

type FeedbackTone = 'success' | 'error';

type FeedbackItem = {
  id: number;
  message: string;
  tone: FeedbackTone;
};

type FeedbackContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children?: ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((message: string, tone: FeedbackTone) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => push(message, 'success'),
      showError: (message: string) => push(message, 'error'),
    }),
    [push],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {items.map((item) => (
          <Toast key={item.id} message={item.message} tone={item.tone} onClose={() => dismiss(item.id)} />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider.');
  }

  return context;
}
