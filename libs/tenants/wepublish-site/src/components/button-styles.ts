import { css, CSSObject, Theme } from '@emotion/react';

import { designText } from '../theme';

// Button variants of the Figma design (file "Website", component "Button")

/** Black button ("Primary"), e.g. "Demo buchen" in the hero */
export const primaryButton = (theme: Theme) => css`
  ${designText.text as CSSObject}
  padding: 15px 30px;
  border: none;
  border-radius: 3px;
  background-color: ${theme.palette.common.black};
  color: ${theme.palette.common.white};
  text-decoration: none;
  text-transform: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;

  &:hover {
    background-color: #313131;
    box-shadow: none;
    text-decoration: none;
  }

  &:active {
    background-color: ${theme.palette.common.black};
  }
`;

/** Outlined button as large as the primary one ("Secondary"), e.g. in the teaser cards */
export const secondaryButton = (theme: Theme) => css`
  ${designText.text as CSSObject}
  padding: 15px 30px;
  border: 1.5px solid ${theme.palette.common.black};
  border-radius: 3px;
  background-color: transparent;
  color: ${theme.palette.common.black};
  text-decoration: none;
  text-transform: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;

  &:hover {
    border-width: 1.5px;
    background-color: rgba(0, 0, 0, 0.05);
    box-shadow: none;
    text-decoration: none;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

/** Outlined button in the mono font ("Tertiary"), e.g. "We.Start" */
export const tertiaryButton = (theme: Theme) => css`
  ${designText.textSmallMono as CSSObject}
  display: inline-flex;
  align-items: center;
  gap: 15px;
  padding: 7px 15px;
  border: 1.5px solid ${theme.palette.common.black};
  border-radius: 3px;
  background-color: transparent;
  color: ${theme.palette.common.black};
  text-decoration: none;
  text-transform: none;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-width: 1.5px;
    background-color: rgba(0, 0, 0, 0.05);
    text-decoration: none;
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

/** The outlined button on a dark background, e.g. in the logo band and the footer */
export const tertiaryButtonOnDark = (theme: Theme) => css`
  ${tertiaryButton(theme)}
  border-color: ${theme.palette.common.white};
  color: ${theme.palette.common.white};

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;
