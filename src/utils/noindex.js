import { useEffect } from 'react';

// Asks search engines not to list this page. Pages that must not be indexed also send an X-Robots-Tag header (vercel.json, server/index.mjs).
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
