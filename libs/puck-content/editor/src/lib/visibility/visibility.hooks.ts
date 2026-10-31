import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useWebsiteTheme } from '../website-theme';
import {
  breakpointRanges,
  hiddenBreakpoints,
  VisibilityValue,
} from './visibility.field';

export const useBreakpointRanges = () => {
  const theme = useWebsiteTheme();

  return useMemo(() => breakpointRanges(theme.breakpoints), [theme]);
};

export const useBreakpointVisibility = (value: VisibilityValue | undefined) => {
  const { t } = useTranslation();
  const ranges = useBreakpointRanges();
  const breakpoints = ranges.map(range => range.breakpoint);
  const hidden = hiddenBreakpoints(value, breakpoints);

  const summary =
    !hidden.length ? t('', 'Shown on all screen sizes')
    : hidden.length === breakpoints.length ? t('', 'Hidden on all screen sizes')
    : t('', 'Hidden on {{breakpoints}}', { breakpoints: hidden.join(', ') });

  return { ranges, breakpoints, hidden, summary };
};

const enabledControl = 'button:not([disabled]), input:not([disabled])';

export const useFirstControlFocus = <Container extends HTMLElement>() => {
  const ref = useRef<Container>(null);

  const focusFirstControl = () =>
    ref.current?.querySelector<HTMLElement>(enabledControl)?.focus();

  return { ref, focusFirstControl };
};
