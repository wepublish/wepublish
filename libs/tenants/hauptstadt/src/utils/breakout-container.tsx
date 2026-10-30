import { css, Theme } from '@emotion/react';

export const breakoutContainerOnXs = <T extends { theme: Theme }>({
  theme,
}: T) => css`
  ${theme.breakpoints.down('sm')} {
    max-width: calc(100% + ${theme.spacing(4)});
    width: auto;
    margin-left: -${theme.spacing(2)};
    margin-right: -${theme.spacing(2)};
  }
`;
