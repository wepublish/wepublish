import { css, Global, Theme } from '@emotion/react';

const lightTokens = css`
  --wep-shell-border: #e3e5ea;
  --wep-surface-shadow:
    0 1px 2px rgb(16 24 40 / 4%), 0 1px 3px rgb(16 24 40 / 6%);
  --wep-elevated-shadow:
    0 12px 32px -8px rgb(16 24 40 / 16%), 0 4px 8px -4px rgb(16 24 40 / 6%);
  --wep-nav-text: #4b5162;
  --wep-nav-hover-text: #121212;
  --wep-nav-hover-bg: rgb(16 24 40 / 5%);
  --wep-nav-active-bg: rgb(52 152 255 / 12%);
  --wep-nav-active-text: #1360b5;
  --wep-nav-active-ring: #1a7ee0;
  --wep-state-pending: #f8def2;
  --wep-state-published: #e1f8de;
  --wep-state-draft: #f8efde;
  --wep-state-pending-text: #8f3f7d;
  --wep-state-published-text: #2f6b2a;
  --wep-state-draft-text: #85560f;
  --wep-row-highlight: #f2faff;
  --wep-row-approved: rgb(76 175 80 / 7%);
  --wep-row-pending: rgb(208 106 184 / 9%);
  --wep-accent-approved: #52ad4a;
  --wep-accent-pending: #d06ab8;
`;

const darkTokens = css`
  --wep-shell-border: #252a33;
  --wep-surface-shadow: 0 1px 2px rgb(0 0 0 / 40%);
  --wep-elevated-shadow:
    0 16px 40px -8px rgb(0 0 0 / 65%), 0 4px 8px -4px rgb(0 0 0 / 40%);
  --wep-nav-text: #a4a9b3;
  --wep-nav-hover-text: #ffffff;
  --wep-nav-hover-bg: rgb(255 255 255 / 6%);
  --wep-nav-active-bg: rgb(52 152 255 / 18%);
  --wep-nav-active-text: #80c3ff;
  --wep-nav-active-ring: #3498ff;
  --wep-state-pending: #46283f;
  --wep-state-published: #23402a;
  --wep-state-draft: #463a22;
  --wep-state-pending-text: #f2b8e4;
  --wep-state-published-text: #a8e2a2;
  --wep-state-draft-text: #f0cf8f;
  --wep-row-highlight: rgb(52 152 255 / 12%);
  --wep-row-approved: rgb(88 177 91 / 6%);
  --wep-row-pending: rgb(208 106 184 / 8%);
  --wep-accent-approved: #58b15b;
  --wep-accent-pending: #d886c5;
`;

const globalStyles = (theme: Theme) => css`
  :root {
    ${lightTokens}

    --wep-state-none: ${theme.vars.palette.background.paper};
  }

  :root[data-mui-color-scheme='dark'] {
    ${darkTokens}
  }

  body {
    font-family: ${theme.typography.fontFamily};
    text-rendering: optimizeLegibility;
  }

  html {
    overscroll-behavior: none;
  }

  fieldset {
    min-width: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    letter-spacing: -0.02em;
    color: ${theme.vars.palette.text.primary};
  }
`;

export function EditorGlobalStyles() {
  return <Global styles={globalStyles} />;
}
