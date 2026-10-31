import {
  Breakpoint,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AutoField,
  createUsePuck,
  Field,
  FieldLabel,
  FieldProps,
} from '@puckeditor/core';

import { useWebsiteTheme } from '../website-theme';
import {
  BreakpointsField,
  BreakpointsValue,
  getActiveBreakpoint,
  resolveBreakpointValue,
  sortBreakpoints,
} from './breakpoints.field';
import {
  BreakpointActiveDot,
  BreakpointAddButton,
  BreakpointAddWrapper,
  BreakpointFields,
  BreakpointRemoveButton,
  BreakpointTab,
  BreakpointTabItem,
  BreakpointTabs,
} from './breakpoints.styles';
import { Fragment, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose } from 'react-icons/md';

const usePuck = createUsePuck();

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
  id,
}: BreakpointsFieldRenderProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const previewWidth = usePuck(
    puck => puck.appState.ui.viewports.current.width
  );
  const current = value ?? {};
  const menuId = useId();
  const addButtonId = useId();

  const allBreakpoints = useMemo(
    () => sortBreakpoints(theme, theme.breakpoints.keys),
    [theme]
  );
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
  const previewBreakpoint =
    typeof previewWidth === 'number' ?
      getActiveBreakpoint(theme, activeBreakpoints, previewWidth)
    : undefined;

  const [selectedState, setSelected] = useState<Breakpoint | undefined>(
    () => previewBreakpoint ?? activeBreakpoints[0]
  );
  const selected =
    selectedState && activeBreakpoints.includes(selectedState) ?
      selectedState
    : activeBreakpoints[0];
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const tabButtons = useRef<
    Partial<Record<Breakpoint, HTMLButtonElement | null>>
  >({});

  const formatSize = (breakpoint: Breakpoint) =>
    `${theme.breakpoints.values[breakpoint]}px`;

  const addBreakpoint = (breakpoint: Breakpoint) => {
    const seed = resolveBreakpointValue(theme, current, breakpoint) ?? {};

    onChange({ ...current, [breakpoint]: seed });
    setSelected(breakpoint);
    setMenuAnchor(null);
  };

  const removeBreakpoint = (breakpoint: Breakpoint) => {
    const rest = Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== breakpoint)
    ) as BreakpointsValue;
    const nextSelected = selected === breakpoint ? baseBreakpoint : selected;

    tabButtons.current[nextSelected]?.focus();
    onChange(rest);
    setSelected(nextSelected);
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

  const addLabel = t('', 'Add breakpoint');

  const content = (
    <>
      <BreakpointTabs>
        {activeBreakpoints.map(breakpoint => {
          const removeLabel = t('', 'Remove {{breakpoint}} breakpoint', {
            breakpoint,
          });
          const removable = breakpoint !== baseBreakpoint && !readOnly;

          return (
            <BreakpointTabItem
              key={breakpoint}
              active={selected === breakpoint}
            >
              <BreakpointTab
                ref={element => {
                  tabButtons.current[breakpoint] = element;
                }}
                type="button"
                active={selected === breakpoint}
                removable={removable}
                aria-pressed={selected === breakpoint}
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
                {previewBreakpoint === breakpoint && <BreakpointActiveDot />}
                {breakpoint}
              </BreakpointTab>

              {removable && (
                <Tooltip title={removeLabel}>
                  <BreakpointRemoveButton
                    type="button"
                    aria-label={removeLabel}
                    onClick={() => removeBreakpoint(breakpoint)}
                  >
                    <MdClose size={12} />
                  </BreakpointRemoveButton>
                </Tooltip>
              )}
            </BreakpointTabItem>
          );
        })}

        <Tooltip title={addLabel}>
          <BreakpointAddWrapper>
            <BreakpointAddButton
              id={addButtonId}
              type="button"
              aria-label={addLabel}
              aria-haspopup="menu"
              aria-expanded={menuAnchor ? true : undefined}
              aria-controls={menuAnchor ? menuId : undefined}
              disabled={readOnly || !availableBreakpoints.length}
              onClick={event => setMenuAnchor(event.currentTarget)}
            >
              <MdAdd size={16} />
            </BreakpointAddButton>
          </BreakpointAddWrapper>
        </Tooltip>

        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            list: { id: menuId, 'aria-labelledby': addButtonId, dense: true },
          }}
        >
          {availableBreakpoints.map(breakpoint => (
            <MenuItem
              key={breakpoint}
              onClick={() => addBreakpoint(breakpoint)}
            >
              <ListItemText>{breakpoint}</ListItemText>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 3 }}
              >
                {formatSize(breakpoint)}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </BreakpointTabs>

      {selected && (
        <BreakpointFields>
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
        </BreakpointFields>
      )}
    </>
  );

  if (field.hideLabel) {
    return <div>{content}</div>;
  }

  return (
    <FieldLabel
      label={field.label ?? t('', 'Breakpoints')}
      readOnly={readOnly}
      el="div"
    >
      {content}
    </FieldLabel>
  );
};
