import styled from '@emotion/styled';
import { Paywall, useShowPaywall } from '@wepublish/paywall/website';
import { createWithTheme } from '@wepublish/ui';
import { Paywall as BuilderPaywall } from '@wepublish/website/builder';

import theme from '../theme';

export const HauptstadtPaywall = createWithTheme(
  styled(Paywall)`
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.primary.contrastText};
  `,
  theme
);

export const DuplicatedPaywall = ({
  paywall,
}: {
  paywall: Parameters<typeof useShowPaywall>[0];
}) => {
  const { showPaywall, hideContent } = useShowPaywall(paywall);

  if (showPaywall && !hideContent) {
    return (
      <BuilderPaywall
        {...paywall!}
        hideContent={hideContent}
        css={{
          gridRowStart: 5, // After 3rd block
        }}
      />
    );
  }

  return null;
};
