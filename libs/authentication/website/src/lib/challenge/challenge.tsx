import { Challenge as ChallengeType } from '@wepublish/website/api';
import { forwardRef } from 'react';
import { TextFieldProps } from '@wepublish/ui';
import Turnstile from 'react-turnstile';

export type BuilderChallengeProps = {
  challenge: ChallengeType;
  onChange?: (token: string) => void;
} & TextFieldProps;

export const CfTurnstileChallenge = forwardRef<
  HTMLInputElement,
  BuilderChallengeProps
>(({ challenge, ...inputProps }: BuilderChallengeProps, ref) => {
  return (
    <Turnstile
      refreshExpired="auto"
      sitekey={challenge.challengeID ?? ''}
      theme="light"
      language={'de'}
      onSuccess={token => inputProps.onChange?.(token)}
    />
  );
});

export const Challenge = forwardRef<HTMLInputElement, BuilderChallengeProps>(
  (props: BuilderChallengeProps, ref) => {
    return (
      <CfTurnstileChallenge
        {...props}
        ref={ref}
      />
    );
  }
);
