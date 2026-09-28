import { useCallback, useEffect, useState } from 'react';

export const LOGIN_LINK_STORAGE_KEY = 'login-link-last-sent';
export const LOGIN_LINK_COOLDOWN_IN_MILLISECONDS = 60 * 1000;

const readLoginLinkSentAt = () => {
  try {
    return Number(localStorage.getItem(LOGIN_LINK_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeLoginLinkSentAt = (sentAt: number) => {
  try {
    localStorage.setItem(LOGIN_LINK_STORAGE_KEY, sentAt.toString());
  } catch {
    return;
  }
};

export const useLoginLinkCooldown = () => {
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setSentAt(readLoginLinkSentAt());
    setNow(Date.now());
  }, []);

  const cooldownEndsAt = sentAt + LOGIN_LINK_COOLDOWN_IN_MILLISECONDS;
  const coolingDown = cooldownEndsAt > now;

  useEffect(() => {
    if (!coolingDown) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [coolingDown]);

  const markLoginLinkSent = useCallback(() => {
    const sentNow = Date.now();

    writeLoginLinkSentAt(sentNow);
    setSentAt(sentNow);
    setNow(sentNow);
  }, []);

  const remainingSeconds =
    coolingDown ? Math.ceil((cooldownEndsAt - now) / 1000) : 0;

  return [remainingSeconds, markLoginLinkSent] as const;
};
