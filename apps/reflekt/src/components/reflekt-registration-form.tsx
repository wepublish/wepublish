import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  RegistrationForm,
  RegistrationFormButton,
} from '@wepublish/authentication/website';
import { BuilderRegistrationFormProps } from '@wepublish/website/builder';
import { forwardRef, MouseEvent } from 'react';

import { buttonLinkSecondaryStyles } from '../theme';
import { PRESS_DURATION_MS } from './hooks/use-press-animation';

const ReflektRegistrationFormWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(4, 0, 8)};

  ${RegistrationFormButton} {
    ${css(buttonLinkSecondaryStyles)}
  }
`;

export const ReflektRegistrationForm = forwardRef<
  HTMLDivElement,
  BuilderRegistrationFormProps
>(function ReflektRegistrationForm(props, ref) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest(
      'button[type="submit"]'
    ) as HTMLButtonElement | null;
    if (!button) {
      return;
    }
    button.classList.add('is-pressing');
    window.setTimeout(() => {
      button.classList.remove('is-pressing');
    }, PRESS_DURATION_MS);
  };

  return (
    <ReflektRegistrationFormWrapper
      ref={ref}
      onClick={handleClick}
    >
      <RegistrationForm {...props} />
    </ReflektRegistrationFormWrapper>
  );
});
