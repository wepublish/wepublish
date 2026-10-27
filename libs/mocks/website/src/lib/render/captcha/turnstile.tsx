import type * as ReactTurnstile from '@marsidev/react-turnstile';
import { mockChallengeToken } from '../../challenge';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { TestCaptcha } from './test-captcha';

export type { TurnstileInstance } from '@marsidev/react-turnstile';

export const Turnstile: typeof ReactTurnstile.Turnstile = forwardRef(
  ({ siteKey, onSuccess }, ref) => {
    const [attempt, setAttempt] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        render: () => undefined,
        execute: () => undefined,
        reset: () => setAttempt(current => current + 1),
        remove: () => undefined,
        getResponse: () => mockChallengeToken,
        getResponsePromise: async () => mockChallengeToken,
        isExpired: () => false,
      }),
      []
    );

    return (
      <TestCaptcha
        siteKey={siteKey}
        onSolve={onSuccess}
        attempt={attempt}
      />
    );
  }
);
