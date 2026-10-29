import styled from '@emotion/styled';
import { Breakpoint } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { sortBreakpoints } from '../breakpoints/breakpoints.field';
import { useWebsiteTheme } from '../website-theme';
import { VisibilityField, VisibilityValue } from './visibility.field';

// Mirrors the colours of the alignment field, but as one connected group
const Options = styled.div`
  display: flex;
`;

const Option = styled.label<{ active: boolean; disabled: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid
    ${({ active }) => (active ? 'var(--puck-color-interactive)' : 'var(--puck-color-border)')};
  margin-left: -1px;
  background: ${({ active }) => (active ? 'var(--puck-color-interactive-soft)' : 'var(--puck-color-surface)')};

  &:first-of-type {
    margin-left: 0;
    border-radius: 4px 0 0 4px;
  }

  &:last-of-type {
    border-radius: 0 4px 4px 0;
  }

  /* Keep the highlighted border of an active option above its neighbours */
  ${({ active }) => (active ? 'position: relative; z-index: 1;' : '')}
  color: ${({ active }) => (active ? 'var(--puck-color-interactive)' : 'var(--puck-color-text)')};
  font-size: var(--puck-font-size-xxs);
  font-weight: 600;
  text-transform: uppercase;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;

export type VisibilityFieldRenderProps = FieldProps<
  VisibilityField,
  VisibilityValue | undefined
>;

export const VisibilityFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: VisibilityFieldRenderProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();

  const breakpoints = useMemo(
    () => sortBreakpoints(theme, theme.breakpoints.keys),
    [theme]
  );

  // Everything is shown unless a value restricts it
  const selected = value ?? breakpoints;

  const toggle = (breakpoint: Breakpoint, checked: boolean) => {
    const next = sortBreakpoints(
      theme,
      checked ?
        [...selected, breakpoint]
      : selected.filter(current => current !== breakpoint)
    );

    onChange(next.length === breakpoints.length ? undefined : next);
  };

  return (
    <FieldLabel
      label={field.label ?? t('', 'Visibility')}
      readOnly={readOnly}
      el="div"
    >
      <Options>
        {breakpoints.map(breakpoint => {
          const active = selected.includes(breakpoint);

          return (
            <Option
              key={breakpoint}
              title={`${theme.breakpoints.values[breakpoint]}px`}
              active={active}
              disabled={!!readOnly}
            >
              <input
                type="checkbox"
                value={breakpoint}
                checked={active}
                disabled={readOnly}
                onChange={event => toggle(breakpoint, event.target.checked)}
              />

              {breakpoint}
            </Option>
          );
        })}
      </Options>
    </FieldLabel>
  );
};
