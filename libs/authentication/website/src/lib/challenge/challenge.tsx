import { useWebsiteBuilder } from '@wepublish/website/builder';
import {
  CaptchaType,
  Challenge as ChallengeType,
} from '@wepublish/website/api';
import styled from '@emotion/styled';
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

export const AlgebraicChallengeWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(max-content, 200px) 200px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: flex-start;
`;

export const AlgebraicChallenge = styled('div')`
  height: 100%;
  display: grid;

  svg {
    height: 100%;
  }
`;

export const MathChallenge = forwardRef<
  HTMLInputElement,
  BuilderChallengeProps
>(({ challenge, ...inputProps }: BuilderChallengeProps, ref) => {
  const {
    elements: { TextField },
  } = useWebsiteBuilder();

  return (
    <AlgebraicChallengeWrapper>
      <AlgebraicChallenge
        dangerouslySetInnerHTML={{
          __html:
            challenge.challenge
              ?.replace('#ffffff', 'transparent')
              .replace('width="200"', '')
              .replace('height="200"', '') ?? '',
        }}
      />

      <TextField
        ref={ref}
        {...inputProps}
      />
    </AlgebraicChallengeWrapper>
  );
});

export const Challenge = forwardRef<HTMLInputElement, BuilderChallengeProps>(
  (props: BuilderChallengeProps, ref) => {
    if (props.challenge.type === CaptchaType.CfTurnstile) {
      return (
        <CfTurnstileChallenge
          {...props}
          ref={ref}
        />
      );
    }

    return (
      <MathChallenge
        {...props}
        ref={ref}
      />
    );
  }
);
