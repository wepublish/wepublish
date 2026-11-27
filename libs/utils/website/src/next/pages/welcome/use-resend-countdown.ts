import { useCallback, useEffect, useState } from 'react';

/** Matches the API's wait between two confirmation mails for one account. */
export const RESEND_COOLDOWN_IN_MILLISECONDS = 60 * 1000;

/**
 * Seconds left until another confirmation mail may be requested, and a
 * callback to start waiting once one was sent.
 */
export const useResendCountdown = () => {
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const endsAt = sentAt + RESEND_COOLDOWN_IN_MILLISECONDS;
  const waiting = sentAt > 0 && endsAt > now;

  useEffect(() => {
    if (!waiting) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [waiting]);

  const markSent = useCallback(() => {
    const sentNow = Date.now();

    setSentAt(sentNow);
    setNow(sentNow);
  }, []);

  const remainingSeconds = waiting ? Math.ceil((endsAt - now) / 1000) : 0;

  return [remainingSeconds, markSent] as const;
};
