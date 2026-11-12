import { Theme } from '@emotion/react';

/**
 * The content of the page (e.g. the hero) takes 10 of the 12 columns of the
 * design. The navbar and the bottom row of the logo band take all 12: one
 * column more on either side, as far as the page margin allows.
 *
 * `contentWidth` is the width of the 10 columns, `pageWidth` the width
 * of the whole page.
 */
export const extraColumn = (
  theme: Theme,
  contentWidth: string,
  pageWidth: string
) =>
  `max(0px, min(${contentWidth} / 10, (${pageWidth} - ${contentWidth}) / 2 - ${theme.spacing(3)}))`;

/** The width of the 10 columns on a full width element of the page */
export const contentWidth = (theme: Theme) =>
  `min(100% - 2 * ${theme.spacing(3)}, ${theme.breakpoints.values.lg}px)`;
