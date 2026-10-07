import { css, Global } from '@emotion/react';

import { EDITOR_FONT_FAMILY } from './theme';

const brandPrimaryScale = css`
  --rs-primary-50: #f2faff;
  --rs-primary-100: #cce9ff;
  --rs-primary-200: #a6d7ff;
  --rs-primary-300: #80c3ff;
  --rs-primary-400: #59afff;
  --rs-primary-500: #3498ff;
  --rs-primary-600: #2589f5;
  --rs-primary-700: #1675e0;
  --rs-primary-800: #0a5dc2;
  --rs-primary-900: #004299;
`;

const shellTokens = css`
  --rs-sidenav-default-bg: transparent;
  --rs-sidenav-default-subnav-border-color: var(--wep-shell-border);
  --rs-sidenav-default-hover-bg: var(--wep-nav-hover-bg);
  --rs-sidenav-default-text: var(--wep-nav-text);
  --rs-sidenav-default-hover-text: var(--rs-text-heading);
  --rs-sidenav-default-selected-text: var(--wep-nav-active-text);
  --rs-sidenav-default-selected-bg: var(--wep-nav-active-bg);
  --rs-navbar-default-bg: transparent;
`;

export function EditorGlobalStyles() {
  return (
    <Global
      styles={css`
        :root {
          --rs-font-family-base: ${EDITOR_FONT_FAMILY};
          --rs-radius-md: 0.5rem;
          --rs-radius-lg: 0.75rem;
          --rs-heading-font-weight: 650;
          --rs-heading-h1-font-size: 1.875rem;
          --rs-heading-h1-line-height: 2.375rem;
          --rs-heading-h2-font-size: 1.5rem;
          --rs-heading-h2-line-height: 2rem;
          --rs-heading-h3-font-size: 1.25rem;
          --rs-heading-h3-line-height: 1.75rem;
          --rs-heading-h4-font-size: 1.0625rem;
          --rs-heading-h4-line-height: 1.5rem;
          --rs-heading-h5-font-size: 0.9375rem;
          --rs-heading-h5-line-height: 1.375rem;
          --rs-heading-h6-font-size: 0.875rem;
          --rs-heading-h6-line-height: 1.25rem;

          --wep-shell-bg: #f3f4f7;
          --wep-shell-border: #e3e5ea;
          --wep-content-bg: #ffffff;
          --wep-surface-shadow:
            0 1px 2px rgb(16 24 40 / 4%), 0 1px 3px rgb(16 24 40 / 6%);
          --wep-elevated-shadow:
            0 12px 32px -8px rgb(16 24 40 / 16%),
            0 4px 8px -4px rgb(16 24 40 / 6%);
          --wep-nav-text: #4b5162;
          --wep-nav-hover-bg: rgb(16 24 40 / 5%);
          --wep-nav-active-bg: rgb(52 152 255 / 12%);
          --wep-nav-active-text: #1675e0;
          --wep-state-pending: #f8def2;
          --wep-state-published: #e1f8de;
          --wep-state-draft: #f8efde;
          --wep-state-none: var(--rs-bg-card);
          --wep-state-pending-text: #8f3f7d;
          --wep-state-published-text: #2f6b2a;
          --wep-state-draft-text: #85560f;
          --wep-row-highlight: #f2faff;
          --wep-row-approved: rgb(76 175 80 / 7%);
          --wep-row-pending: rgb(208 106 184 / 9%);
          --wep-accent-approved: #52ad4a;
          --wep-accent-pending: #d06ab8;

          ${shellTokens}
        }

        body.rs-theme-dark {
          ${brandPrimaryScale}

          --wep-shell-bg: #0a0d12;
          --wep-shell-border: #252a33;
          --wep-content-bg: #14181f;
          --wep-surface-shadow: 0 1px 2px rgb(0 0 0 / 40%);
          --wep-elevated-shadow:
            0 16px 40px -8px rgb(0 0 0 / 65%), 0 4px 8px -4px rgb(0 0 0 / 40%);
          --wep-nav-text: #a4a9b3;
          --wep-nav-hover-bg: rgb(255 255 255 / 6%);
          --wep-nav-active-bg: rgb(52 152 255 / 18%);
          --wep-nav-active-text: #80c3ff;
          --wep-state-pending: #46283f;
          --wep-state-published: #23402a;
          --wep-state-draft: #463a22;
          --wep-state-none: var(--rs-bg-card);
          --wep-state-pending-text: #f2b8e4;
          --wep-state-published-text: #a8e2a2;
          --wep-state-draft-text: #f0cf8f;
          --wep-row-highlight: rgb(52 152 255 / 12%);
          --wep-row-approved: rgb(88 177 91 / 6%);
          --wep-row-pending: rgb(208 106 184 / 8%);
          --wep-accent-approved: #58b15b;
          --wep-accent-pending: #d886c5;
          --rs-bg-success: rgb(from var(--rs-state-success) r g b / 14%);
          --rs-bg-error: rgb(from var(--rs-state-error) r g b / 14%);
          --rs-bg-warning: rgb(from var(--rs-state-warning) r g b / 14%);
          --rs-bg-info: rgb(from var(--rs-state-info) r g b / 14%);
          --rs-message-info-bg: rgb(from var(--rs-color-blue) r g b / 16%);
          --rs-message-info-text: var(--rs-text-primary);
          --rs-message-info-header: var(--rs-text-heading);
          --rs-message-success-bg: rgb(from var(--rs-color-green) r g b / 16%);
          --rs-message-success-text: var(--rs-text-primary);
          --rs-message-success-header: var(--rs-text-heading);
          --rs-message-warning-bg: rgb(from var(--rs-color-yellow) r g b / 16%);
          --rs-message-warning-text: var(--rs-text-primary);
          --rs-message-warning-header: var(--rs-text-heading);
          --rs-message-error-bg: rgb(from var(--rs-color-red) r g b / 16%);
          --rs-message-error-text: var(--rs-text-primary);
          --rs-message-error-header: var(--rs-text-heading);

          ${shellTokens}
        }

        body {
          font-family: var(--rs-font-family-base);
          text-rendering: optimizeLegibility;
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
          color: var(--rs-text-heading);
        }

        .rs-panel {
          --rs-panel-border-radius: var(--rs-radius-lg);
        }

        .rs-panel-bordered {
          border-color: var(--wep-shell-border);
          background-color: var(--rs-bg-card);
          box-shadow: var(--wep-surface-shadow);
        }

        .rs-panel-header {
          h1,
          h2,
          h3 {
            font-size: 1.0625rem;
            line-height: 1.5rem;
          }
        }

        .rs-btn {
          font-weight: 500;
        }

        .rs-btn[data-appearance='primary'] {
          box-shadow:
            0 1px 2px rgb(from var(--rs-primary-800) r g b / 30%),
            inset 0 1px 0 rgb(255 255 255 / 14%);
        }

        .rs-btn-icon[data-with-text] {
          padding-inline: var(--rs-btn-padding-inline);

          > .rs-icon {
            position: static;
            display: inline-block;
            width: auto;
            height: auto;
            padding: 0;
            border: 0;
            margin-inline-end: 0.5em;
            background-color: transparent !important;
          }
        }

        .rs-badge-wrapper:has(> .rs-btn) {
          vertical-align: middle;
        }

        .rs-table
          .rs-btn-icon[data-shape='circle']:where(
            [data-appearance='default'],
            [data-appearance='ghost'],
            [data-appearance='subtle']
          ) {
          background-color: transparent;
          border-color: transparent;
          color: var(--rs-text-secondary);

          &:hover:not(:disabled) {
            background-color: var(--wep-nav-hover-bg);
            color: var(--rs-text-heading);
          }

          &[data-color='red'] {
            color: var(--rs-state-error);

            &:hover:not(:disabled) {
              background-color: rgb(from var(--rs-state-error) r g b / 12%);
              color: var(--rs-state-error);
            }
          }
        }

        .rs-table-row-header,
        .rs-table-row-header .rs-table-cell {
          background-color: var(--rs-bg-well);
        }

        .rs-pagination .rs-pagination-btn[data-active='true'][data-appearance] {
          background-color: var(--wep-nav-active-bg);
          color: var(--wep-nav-active-text);
          font-weight: 600;
        }

        .rs-table {
          font-size: var(--rs-font-size-sm);
        }

        .rs-table-cell-content {
          text-overflow: ellipsis;
        }

        .rs-message-content {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        @media (max-width: 899px) {
          .rs-message-header {
            white-space: normal;
          }
        }

        body.rs-theme-dark .rs-message {
          background-color: var(--rs-bg-card);
        }

        .rs-table-cell-header .rs-table-cell-content {
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .rs-modal-content {
          border-radius: var(--rs-radius-lg);
          box-shadow: var(--wep-elevated-shadow);
        }

        .rs-popover,
        .rs-dropdown-menu,
        .rs-picker-popup {
          box-shadow: var(--wep-elevated-shadow);
        }

        .rs-toast-container {
          gap: 8px;
        }

        .rs-toast-container-top-center {
          top: auto;
          bottom: 16px;
          left: auto;
          right: 16px;
          width: auto;
          align-items: flex-end;
        }

        .rs-toast-container .rs-toast {
          width: max-content;
          max-width: min(440px, calc(100vw - 32px));
          margin: 0;
        }

        .rs-toast-container .rs-message {
          border: 1px solid var(--wep-shell-border, var(--rs-border-primary));
          border-radius: var(--rs-radius-lg);
          box-shadow: var(--wep-elevated-shadow);
        }

        @media (max-width: 899px) {
          :root {
            --rs-heading-h1-font-size: 1.5rem;
            --rs-heading-h1-line-height: 2rem;
            --rs-heading-h2-font-size: 1.375rem;
            --rs-heading-h2-line-height: 1.875rem;
            --rs-heading-h3-font-size: 1.125rem;
            --rs-heading-h3-line-height: 1.625rem;
          }

          .rs-drawer-body {
            --rs-drawer-body-padding: 20px 16px;
          }
        }

        @media (max-width: 640px) {
          .rs-row > .rs-col[class*='rs-col-xs-'] {
            width: 100%;
            margin-inline-start: 0;
            inset-inline: auto;
          }
        }
      `}
    />
  );
}
