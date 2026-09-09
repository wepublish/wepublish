import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Breakpoint } from '@mui/material';
import {
  AutoField,
  createUsePuck,
  Field,
  FieldLabel,
  FieldProps,
} from '@puckeditor/core';

import {
  BreakpointsField,
  BreakpointsValue,
  getActiveBreakpoint,
  resolveBreakpointValue,
  sortBreakpoints,
} from './breakpoints.field';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose } from 'react-icons/md';

const usePuck = createUsePuck();

// Puck's public AutoField renders these built-in types without their label,
// so we draw the heading ourselves. Custom field types (including our own
// plugins) render their own FieldLabel from field.label.
const unlabelledFieldTypes = new Set([
  'text',
  'textarea',
  'number',
  'select',
  'radio',
  'array',
  'object',
  'external',
]);

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  margin-bottom: 12px;
`;

const Tab = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 0;
  border-bottom: 2px solid
    ${({ active, theme }) =>
      active ? theme.palette.action.active : 'transparent'};
  margin-bottom: -1px;
  background: transparent;
  color: ${({ active, theme }) =>
    active ? theme.palette.text.primary : theme.palette.text.secondary};
  font: inherit;
  font-weight: ${({ active }) => (active ? 600 : 400)};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ActiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.palette.success.main};
`;

const TabRemove = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 50%;
  color: ${({ theme }) => theme.palette.text.secondary};

  &:hover {
    color: ${({ theme }) => theme.palette.text.primary};
  }
`;

const AddWrapper = styled.div`
  position: relative;
  margin-left: auto;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Menu = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 10;
  min-width: 160px;
  margin: 0;
  padding: 4px;
  list-style: none;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 4px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const MenuItem = styled.button`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
  }
`;

const Size = styled.span`
  font-size: 0.85em;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const Fields = styled.div`
  display: grid;
  gap: 16px;
`;

export type BreakpointsFieldRenderProps = FieldProps<
  BreakpointsField,
  BreakpointsValue
> & {
  name: string;
  id?: string;
};

export const BreakpointsFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  name,
  id,
}: BreakpointsFieldRenderProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const previewWidth = usePuck(
    puck => puck.appState.ui.viewports.current.width
  );
  const current = value ?? {};

  const allBreakpoints = useMemo(
    () => sortBreakpoints(theme, theme.breakpoints.keys),
    [theme]
  );
  // The smallest breakpoint is the base every other breakpoint inherits from,
  // so it is always present and can never be removed.
  const baseBreakpoint = allBreakpoints[0];
  const activeBreakpoints = useMemo(
    () =>
      sortBreakpoints(theme, [
        ...new Set([baseBreakpoint, ...(Object.keys(current) as Breakpoint[])]),
      ]),
    [theme, baseBreakpoint, current]
  );
  const availableBreakpoints = allBreakpoints.filter(
    breakpoint => !activeBreakpoints.includes(breakpoint)
  );
  // Breakpoint that currently applies in the preview. Unknown when the preview
  // fills the available space ("100%") since the field has no access to its
  // rendered width.
  const previewBreakpoint =
    typeof previewWidth === 'number' ?
      getActiveBreakpoint(theme, activeBreakpoints, previewWidth)
    : undefined;

  const [selected, setSelected] = useState<Breakpoint | undefined>(
    () => previewBreakpoint ?? activeBreakpoints[0]
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the selection valid when breakpoints get removed externally
  useEffect(() => {
    if (!selected || !activeBreakpoints.includes(selected)) {
      setSelected(activeBreakpoints[0]);
    }
  }, [activeBreakpoints, current, selected]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);

    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const formatSize = (breakpoint: Breakpoint) =>
    `${theme.breakpoints.values[breakpoint]}px`;

  const addBreakpoint = (breakpoint: Breakpoint) => {
    // Seed the new breakpoint with the resolved value so it starts identical
    // to what is currently shown at that width.
    const seed = resolveBreakpointValue(theme, current, breakpoint) ?? {};

    onChange({ ...current, [breakpoint]: seed });
    setSelected(breakpoint);
    setMenuOpen(false);
  };

  const removeBreakpoint = (breakpoint: Breakpoint) => {
    const rest = Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== breakpoint)
    ) as BreakpointsValue;

    onChange(rest);

    if (selected === breakpoint) {
      setSelected(baseBreakpoint);
    }
  };

  const changeSubField = (subName: string, subValue: unknown) => {
    if (!selected) {
      return;
    }

    onChange({
      ...current,
      [selected]: {
        ...current[selected],
        [subName]: subValue,
      },
    });
  };

  return (
    <FieldLabel
      label={field.label ?? t('', 'Breakpoints')}
      readOnly={readOnly}
      el="div"
    >
      <Tabs>
        {activeBreakpoints.map(breakpoint => (
          <Tab
            key={breakpoint}
            type="button"
            active={selected === breakpoint}
            disabled={readOnly}
            title={
              previewBreakpoint === breakpoint ?
                t('', '{{size}} (active in preview)', {
                  size: formatSize(breakpoint),
                })
              : formatSize(breakpoint)
            }
            onClick={() => setSelected(breakpoint)}
          >
            {previewBreakpoint === breakpoint && <ActiveDot />}
            {breakpoint}

            {breakpoint !== baseBreakpoint && !readOnly && (
              <TabRemove
                role="button"
                aria-label={t('', 'Remove breakpoint')}
                onClick={event => {
                  event.stopPropagation();
                  removeBreakpoint(breakpoint);
                }}
              >
                <MdClose size={12} />
              </TabRemove>
            )}
          </Tab>
        ))}

        <AddWrapper ref={menuRef}>
          <AddButton
            type="button"
            aria-label={t('', 'Add breakpoint')}
            aria-expanded={menuOpen}
            disabled={readOnly || !availableBreakpoints.length}
            onClick={() => setMenuOpen(open => !open)}
          >
            <MdAdd size={16} />
          </AddButton>

          {menuOpen && (
            <Menu>
              {availableBreakpoints.map(breakpoint => (
                <li key={breakpoint}>
                  <MenuItem
                    type="button"
                    onClick={() => addBreakpoint(breakpoint)}
                  >
                    <span>{breakpoint}</span>
                    <Size>{formatSize(breakpoint)}</Size>
                  </MenuItem>
                </li>
              ))}
            </Menu>
          )}
        </AddWrapper>
      </Tabs>

      {selected && (
        <Fields>
          {Object.entries(field.objectFields).map(([subName, subField]) => {
            const label = subField.label ?? subName;
            const autoField = (
              <AutoField
                id={id ? `${id}_${selected}_${subName}` : undefined}
                field={subField as Field}
                value={current[selected]?.[subName]}
                readOnly={readOnly}
                onChange={subValue => changeSubField(subName, subValue)}
              />
            );

            if (!unlabelledFieldTypes.has(subField.type)) {
              return (
                <Fragment key={`${selected}-${subName}`}>{autoField}</Fragment>
              );
            }

            return (
              <FieldLabel
                key={`${selected}-${subName}`}
                label={label}
                readOnly={readOnly}
                el="div"
              >
                {autoField}
              </FieldLabel>
            );
          })}
        </Fields>
      )}
    </FieldLabel>
  );
};
