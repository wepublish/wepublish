import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { LoginForm, LoginFormButton } from '@wepublish/authentication/website';
import { BuilderLoginFormProps } from '@wepublish/website/builder';
import { forwardRef, MouseEvent } from 'react';

import { buttonLinkSecondaryStyles } from '../theme';
import { PRESS_DURATION_MS } from './hooks/use-press-animation';

const ReflektLoginFormWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(4, 0, 8)};

  .MuiOutlinedInput-root {
    border-radius: 0;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }

  ${LoginFormButton} {
    ${css(buttonLinkSecondaryStyles)}
  }
`;

export const ReflektLoginForm = forwardRef<
  HTMLDivElement,
  BuilderLoginFormProps
>(function ReflektLoginForm(props, ref) {
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
    <ReflektLoginFormWrapper
      ref={ref}
      onClick={handleClick}
    >
      <LoginForm {...props} />
    </ReflektLoginFormWrapper>
  );
});
