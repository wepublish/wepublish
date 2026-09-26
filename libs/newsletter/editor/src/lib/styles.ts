import styled from '@emotion/styled';

/**
 * The editor's own controls, styled to sit inside Puck's sidebar. Puck ships
 * its own stylesheet; these only cover what this lib adds to it.
 */

export const colors = {
  ink: '#0e1116',
  muted: '#5c6870',
  line: '#d9e2dd',
  accent: '#195a7d',
  accentTint: '#eaf2f7',
  panel: '#f4f7f6',
  warn: '#8a5300',
  error: '#a12b2b',
} as const;

export const SmallButton = styled('button')`
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 6px 10px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
  color: ${colors.accent};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${colors.accent};
  }

  &[data-active='true'] {
    border-color: ${colors.accent};
    background: ${colors.accentTint};
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
`;

export const SmallInput = styled('input')`
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
  color: ${colors.ink};
  min-width: 0;

  &:disabled {
    background: ${colors.panel};
    color: ${colors.muted};
  }
`;

export const SmallSelect = styled('select')`
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
  color: ${colors.ink};
  min-width: 0;

  &:disabled {
    background: ${colors.panel};
    color: ${colors.muted};
  }
`;

export const Note = styled('p')<{ kind?: 'warn' | 'error' }>`
  margin: 4px 0 0;
  font-size: 12px;
  color: ${({ kind }) =>
    kind === 'error' ? colors.error
    : kind === 'warn' ? colors.warn
    : colors.muted};
`;

export const Toolbar = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
`;

export const Popover = styled('div')`
  margin-bottom: 4px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
`;

export const PopoverSearch = styled('input')`
  display: block;
  width: 100%;
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  border: 0;
  border-bottom: 1px solid ${colors.line};
  border-radius: 4px 4px 0 0;
`;

export const PopoverList = styled('div')`
  max-height: 240px;
  overflow-y: auto;
`;

export const PopoverGroup = styled('p')`
  position: sticky;
  top: 0;
  margin: 0;
  padding: 4px 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${colors.muted};
  background: ${colors.panel};
`;

export const PopoverItem = styled('button')`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  font: inherit;
  font-size: 13px;
  text-align: left;
  padding: 5px 8px;
  border: 0;
  background: none;
  color: ${colors.ink};
  cursor: pointer;

  &:hover {
    background: ${colors.accentTint};
  }

  code {
    font-size: 11px;
    color: ${colors.accent};
    white-space: nowrap;
  }
`;

export const Editable = styled('div')`
  display: block;
  width: 100%;
  min-height: 140px;
  max-height: 420px;
  overflow-y: auto;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 10px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
  color: ${colors.ink};

  &:focus {
    outline: 2px solid ${colors.accent};
    outline-offset: -1px;
  }

  p {
    margin: 0 0 8px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  a {
    color: ${colors.accent};
    text-decoration: underline;
  }
`;

export const ConditionRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  > select:first-of-type {
    flex: 1 1 100%;
  }

  > select:nth-of-type(2) {
    flex: 0 0 auto;
  }

  > select:last-of-type:not(:first-of-type):not(:nth-of-type(2)),
  > input {
    flex: 1 1 80px;
  }
`;

export const ConditionPreview = styled('p')`
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: ${colors.accent};
  overflow-wrap: anywhere;
`;

export const ImagePreview = styled('img')`
  display: block;
  max-width: 100%;
  max-height: 120px;
  margin-top: 8px;
  border: 1px solid ${colors.line};
  border-radius: 4px;
  background: #fff;
`;

export const HeaderLink = styled('a')`
  align-self: center;
  margin-right: 12px;
  font-size: 14px;
  color: ${colors.accent};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

export const HeaderState = styled('span')<{
  kind: 'error' | 'busy' | 'stale' | 'clean';
}>`
  align-self: center;
  margin-right: 12px;
  font-size: 13px;
  white-space: nowrap;
  max-width: 42ch;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ kind }) =>
    kind === 'error' ? colors.error
    : kind === 'stale' ? colors.warn
    : colors.muted};
`;

export const HeaderButton = styled('button')<{ primary?: boolean }>`
  font: inherit;
  font-size: 14px;
  line-height: 1;
  margin-right: 8px;
  padding: 10px 16px;
  border: 1px solid ${colors.accent};
  border-radius: 6px;
  background: ${({ primary }) => (primary ? colors.accent : '#fff')};
  color: ${({ primary }) => (primary ? '#fff' : colors.accent)};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ primary }) => (primary ? colors.accent : '#f0faff')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
`;

export const ReportPanel = styled('div')`
  font-size: 13px;
`;

export const ReportHeading = styled('div')`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: -16px -16px 12px;
  padding: 16px;
  border-bottom: 1px solid #dcdcdc;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    color: #000;
  }
`;

export const ReportCount = styled('span')<{ kind: 'error' | 'warn' | 'info' }>`
  font-size: 12px;
  white-space: nowrap;
  color: ${({ kind }) =>
    kind === 'error' ? colors.error
    : kind === 'warn' ? colors.warn
    : colors.muted};
`;

export const Meter = styled('span')<{ stale: boolean }>`
  display: block;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e6ebe9;
  overflow: hidden;
  ${({ stale }) =>
    stale ?
      `background-image: repeating-linear-gradient(-45deg, rgb(14 17 22 / 8%) 0 3px, transparent 3px 6px);`
    : ''}

  > span {
    display: block;
    height: 100%;
    border-radius: 4px;
    transition: width 120ms linear;
    opacity: ${({ stale }) => (stale ? 0.45 : 1)};
  }
`;

export const ReportSize = styled('p')`
  margin: 6px 0 0;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: ${colors.ink};
`;

export const ReportList = styled('ul')`
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
`;

export const ReportNote = styled('li')<{ kind: 'error' | 'warn' | 'info' }>`
  position: relative;
  padding: 3px 0 3px 16px;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  color: ${({ kind }) =>
    kind === 'error' ? colors.error
    : kind === 'warn' ? colors.warn
    : colors.muted};
  font-weight: ${({ kind }) => (kind === 'error' ? 600 : 400)};

  &::before {
    position: absolute;
    left: 0;
    content: '${({ kind }) =>
      kind === 'error' ? '×'
      : kind === 'warn' ? '!'
      : '·'}';
  }
`;
