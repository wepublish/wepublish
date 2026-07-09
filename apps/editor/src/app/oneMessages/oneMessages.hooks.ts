import { getSettings } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';

import type { OneMessage, OneMessagesResponse } from './oneMessages.types';

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MINIMIZED_STORAGE_KEY = 'wep-one-minimized-messages';

function getBaseUrl(): string {
  return (process.env.WEP_ONE_URL || getSettings().wepOneURL).replace(
    /\/+$/,
    ''
  );
}

function getMedium(): string {
  return (process.env.APP_NAME || getSettings().medium || '').toLowerCase();
}

/**
 * Fetches the notices to render. Best-effort: any error (network, non-200,
 * malformed body) resolves to an empty list so the banner can never block or
 * break the editor. The server does all status/date/medium/locale filtering
 * and sorting, so the result is rendered as-is.
 */
export async function fetchOneMessages(locale: string): Promise<OneMessage[]> {
  const params = new URLSearchParams();
  const medium = getMedium();

  if (medium) {
    params.set('medium', medium);
  }

  if (locale) {
    params.set('locale', locale);
  }

  try {
    const response = await fetch(`${getBaseUrl()}/messages?${params}`);

    if (!response.ok) {
      return [];
    }

    const json: OneMessagesResponse = await response.json();

    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export function getMinimized(): number[] {
  try {
    const raw = localStorage.getItem(MINIMIZED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setMinimized(id: number, minimized: boolean): void {
  const next = new Set(getMinimized());

  if (minimized) {
    next.add(id);
  } else {
    next.delete(id);
  }

  localStorage.setItem(MINIMIZED_STORAGE_KEY, JSON.stringify([...next]));
}

export function isMinimized(message: OneMessage): boolean {
  return message.dismissible && getMinimized().includes(message.id);
}

/**
 * Loads the notices once, re-loads when the locale changes, and polls every
 * few minutes (plus on window focus) so a newly published critical notice
 * appears without a reload.
 */
export function useOneMessages(locale: string): OneMessage[] {
  const [messages, setMessages] = useState<OneMessage[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await fetchOneMessages(locale);

      if (!cancelled) {
        setMessages(next);
      }
    };

    load();

    const interval = setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener('focus', load);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', load);
    };
  }, [locale]);

  return messages;
}
