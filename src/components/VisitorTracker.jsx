'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function hasAdminSessionCookie() {
  if (typeof document === 'undefined') return false;
  try {
    return document.cookie.split(';').some((item) => item.trim().startsWith('admin_auth='));
  } catch {
    return false;
  }
}

function getOrCreateVisitorId() {
  if (typeof window === 'undefined') return null;
  const STORAGE_KEY = 'klasik_vid';
  try {
    let vid = localStorage.getItem(STORAGE_KEY);
    if (!vid || typeof vid !== 'string' || vid.length < 8) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        vid = crypto.randomUUID();
      } else {
        vid = 'v_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return null;
  }
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    // Skip tracking when the admin session cookie is present
    if (hasAdminSessionCookie()) return;

    // Ignore admin and API paths
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // Avoid double-firing on identical path render
    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const payload = JSON.stringify({ visitorId, path: pathname });

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'text/plain' });
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking catch
    }
  }, [pathname]);

  return null;
}
