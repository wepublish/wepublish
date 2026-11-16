import {
  Box,
  ClickAwayListener,
  InputAdornment,
  Popper,
  TextField as MuiTextField,
} from '@mui/material';
import { Sketch } from '@uiw/react-color';
import { useField } from '@wepublish/form/core';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { textFieldProps } from '../field-anatomy';
import { HEX_COLOR, isOpaque } from './color-format';

export type ColorFieldProps = {
  presetColors?: string[];
};

const sketchStyle = {
  '--sketch-background': 'var(--mui-palette-background-paper)',
  '--sketch-box-shadow':
    'var(--mui-palette-divider) 0 0 0 1px, rgb(0 0 0 / 25%) 0 8px 16px',
  '--sketch-swatch-box-shadow': 'var(--mui-palette-divider) 0 0 0 1px inset',
  '--sketch-alpha-box-shadow': 'var(--mui-palette-divider) 0 0 0 1px inset',
  '--sketch-swatch-border-top': '1px solid var(--mui-palette-divider)',
} as CSSProperties;

const paletteSx = {
  '& .w-color-editable-input': {
    '--editable-input-label-color':
      'var(--mui-palette-text-secondary) !important',
    '--editable-input-color': 'var(--mui-palette-text-primary) !important',
    '--editable-input-box-shadow':
      'inset 0 0 0 1px var(--mui-palette-divider) !important',
  },
};

export function ColorField({ presetColors }: ColorFieldProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const value = field.value ?? '';
  const locked = field.disabled || field.readOnly;
  const opaque = isOpaque(field.kindParams);

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && anchor) {
      event.stopPropagation();
      setAnchor(null);
    }
  };

  return (
    <>
      <MuiTextField
        {...textFieldProps(field, {
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  component="button"
                  type="button"
                  aria-label={t('form.color.pick')}
                  aria-expanded={anchor !== null}
                  disabled={locked}
                  onClick={event => setAnchor(event.currentTarget)}
                  onKeyDown={closeOnEscape}
                  sx={{
                    width: 24,
                    height: 24,
                    p: 0,
                    borderRadius: '3px',
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: value || 'transparent',
                    cursor: locked ? 'default' : 'pointer',
                  }}
                />
              </InputAdornment>
            ),
          },
          htmlInput: { spellCheck: false },
        })}
        inputRef={ref}
        value={value}
        onChange={event => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      <Popper
        open={anchor !== null && !locked}
        anchorEl={anchor}
        placement="bottom-start"
        sx={{ zIndex: 'modal' }}
        onKeyDown={closeOnEscape}
      >
        <ClickAwayListener onClickAway={() => setAnchor(null)}>
          <Box sx={paletteSx}>
            <Sketch
              color={HEX_COLOR.test(value) ? value : undefined}
              presetColors={presetColors}
              disableAlpha={opaque}
              style={sketchStyle}
              onChange={color =>
                field.onChange(
                  opaque || color.rgba.a === 1 ? color.hex : color.hexa
                )
              }
            />
          </Box>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
