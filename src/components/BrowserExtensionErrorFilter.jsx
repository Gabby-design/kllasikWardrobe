'use client';

import { useEffect } from 'react';

export function BrowserExtensionErrorFilter() {
  useEffect(() => {
    const isExtensionError = (message) => {
      if (!message || typeof message !== 'string') return false;
      return message.toLowerCase().includes('could not establish connection. receiving end does not exist');
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message;
      if (isExtensionError(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const handleError = (event) => {
      const msg = event?.message || event?.error?.message;
      if (isExtensionError(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}
