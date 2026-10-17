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

function sendTrackPayload(payloadObj) {
  try {
    const payload = JSON.stringify(payloadObj);
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
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const lastPingRef = useRef(Date.now());

  // 1. Track route changes
  useEffect(() => {
    if (!pathname) return;
    if (hasAdminSessionCookie()) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    sendTrackPayload({ visitorId, path: pathname });
  }, [pathname]);

  // 2. Active Session Duration Heartbeat (every 20 seconds while user is browsing)
  useEffect(() => {
    if (hasAdminSessionCookie()) return;
    if (typeof window === 'undefined') return;

    const emitHeartbeat = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      const now = Date.now();
      const deltaSeconds = Math.round((now - lastPingRef.current) / 1000);
      const totalSessionSeconds = Math.round((now - sessionStartRef.current) / 1000);
      lastPingRef.current = now;

      if (deltaSeconds >= 5) {
        sendTrackPayload({
          visitorId,
          heartbeat: true,
          durationSeconds: totalSessionSeconds,
          deltaSeconds,
        });
      }
    };

    const intervalId = setInterval(emitHeartbeat, 20000);

    // Also send heartbeat when user leaves or switches away from page
    const handleVisibilityOrUnload = () => {
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      const now = Date.now();
      const deltaSeconds = Math.round((now - lastPingRef.current) / 1000);
      const totalSessionSeconds = Math.round((now - sessionStartRef.current) / 1000);
      lastPingRef.current = now;

      if (deltaSeconds >= 3) {
        sendTrackPayload({
          visitorId,
          heartbeat: true,
          durationSeconds: totalSessionSeconds,
          deltaSeconds,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrUnload);
    window.addEventListener('pagehide', handleVisibilityOrUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
      window.removeEventListener('pagehide', handleVisibilityOrUnload);
    };
  }, []);

  return null;
}
