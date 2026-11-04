import {
  CaptchaType,
  Challenge as ChallengeType,
} from '@wepublish/website/api';
import { forwardRef, Ref, useImperativeHandle, useRef } from 'react';
import { TextFieldProps } from '@wepublish/ui';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useTranslation } from 'react-i18next';

export type BuilderChallengeRef = { reset: () => void };
export type BuilderChallengeProps = {
  challenge: ChallengeType;
  onChange?: (token: string) => void;
  challengeRef: Ref<BuilderChallengeRef | undefined>;
} & TextFieldProps;

export const CfTurnstileChallenge = forwardRef<
  HTMLInputElement,
  BuilderChallengeProps
>(({ challenge, challengeRef, ...inputProps }: BuilderChallengeProps, ref) => {
  const { i18n } = useTranslation();
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useImperativeHandle(challengeRef, () => {
    return {
      reset: () => turnstileRef.current?.reset(),
    };
  }, []);

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={challenge.challengeID ?? ''}
      options={{
        refreshExpired: 'auto',
        theme: 'light',
        language: i18n.language,
      }}
      onSuccess={token => inputProps.onChange?.(token)}
      onExpire={() => turnstileRef.current?.reset()}
    />
  );
});

export const HCaptchaChallenge = forwardRef<
  HTMLInputElement,
  BuilderChallengeProps
>(({ challenge, ...inputProps }: BuilderChallengeProps, ref) => {
  const { i18n } = useTranslation();

  return (
    <HCaptcha
      sitekey={challenge.challengeID ?? ''}
      languageOverride={i18n.language}
      onVerify={token => inputProps.onChange?.(token)}
    />
  );
});

export const Challenge = forwardRef<HTMLInputElement, BuilderChallengeProps>(
  (props: BuilderChallengeProps, ref) => {
    switch (props.challenge.type) {
      case CaptchaType.HCaptcha:
        return (
          <HCaptchaChallenge
            {...props}
            ref={ref}
          />
        );
      case CaptchaType.CfTurnstile:
      default:
        return (
          <CfTurnstileChallenge
            {...props}
            ref={ref}
          />
        );
    }
  }
);
