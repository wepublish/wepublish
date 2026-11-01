import {
  Breakpoint,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { AutoField, Field, FieldLabel, FieldProps } from '@puckeditor/core';

import { useWebsiteTheme } from '../website-theme';
import { BreakpointsField, BreakpointsValue } from './breakpoints.field';
import {
  BreakpointSelection,
  useBreakpointSelection,
} from './breakpoints.hooks';
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
import { Fragment, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose } from 'react-icons/md';

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

export type BreakpointTabsBarProps<Value extends BreakpointsValue> = {
  value: Value | undefined;
  selection: BreakpointSelection;
  readOnly?: boolean;
  onChange: (value: Value) => void;
};

export const BreakpointTabsBar = <Value extends BreakpointsValue>({
  value,
  selection,
  readOnly,
  onChange,
}: BreakpointTabsBarProps<Value>) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const current = value ?? ({} as Value);
  const menuId = useId();
  const addButtonId = useId();
  const {
    baseBreakpoint,
    activeBreakpoints,
    availableBreakpoints,
    previewBreakpoint,
    selected,
    setSelected,
  } = selection;
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const tabButtons = useRef<
    Partial<Record<Breakpoint, HTMLButtonElement | null>>
  >({});

  const formatSize = (breakpoint: Breakpoint) =>
    `${theme.breakpoints.values[breakpoint]}px`;

  const addBreakpoint = (breakpoint: Breakpoint) => {
    onChange({ ...current, [breakpoint]: {} });
    setSelected(breakpoint);
    setMenuAnchor(null);
  };

  const removeBreakpoint = (breakpoint: Breakpoint) => {
    const rest = Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== breakpoint)
    ) as Value;
    const nextSelected = selected === breakpoint ? baseBreakpoint : selected;

    tabButtons.current[nextSelected]?.focus();
    onChange(rest);
    setSelected(nextSelected);
  };

  const addLabel = t('', 'Add breakpoint');

  return (
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
  );
};

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
  const current = value ?? {};
  const selection = useBreakpointSelection(current);
  const { selected } = selection;

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

  const content = (
    <>
      <BreakpointTabsBar
        value={current}
        selection={selection}
        readOnly={readOnly}
        onChange={onChange}
      />

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
