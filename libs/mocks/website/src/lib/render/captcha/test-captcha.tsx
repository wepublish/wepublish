import { mockChallengeToken } from '../../challenge';
import { useEffect, useEffectEvent } from 'react';

type TestCaptchaProps = {
  siteKey?: string;
  onSolve?: (token: string) => void;
  attempt?: number;
  language?: string;
};

export const TEST_CAPTCHA_LABEL = 'Captcha';

export const TestCaptcha = ({
  siteKey,
  onSolve,
  attempt = 0,
  language,
}: TestCaptchaProps) => {
  const solve = useEffectEvent(() => onSolve?.(mockChallengeToken));

  useEffect(() => {
    const timeout = setTimeout(solve);

    return () => clearTimeout(timeout);
  }, [attempt]);

  return (
    <div
      role="group"
      aria-label={TEST_CAPTCHA_LABEL}
      data-sitekey={siteKey}
      data-attempt={attempt}
      data-language={language}
    />
  );
};
