import styled from '@emotion/styled';
import {
  Box,
  ClickAwayListener,
  FormHelperText,
  Popper,
  TextField,
} from '@mui/material';
import { Sketch } from '@uiw/react-color';
import {
  ChangeEvent,
  ChangeEventHandler,
  CSSProperties,
  FocusEventHandler,
  forwardRef,
  KeyboardEvent,
  ReactNode,
  useRef,
  useState,
} from 'react';
import { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { IconButtonTooltip } from './iconButtonTooltip';

type ColorPickerProps = {
  name?: string;
  label?: string;
  helperText?: ReactNode;
  value?: string | null;
  disabled?: boolean;
  presetColors?: string[];
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: FieldError;
};

const Palette = styled('div')`
  .w-color-editable-input {
    --editable-input-label-color: ${({ theme }) =>
      theme.vars.palette.text.secondary} !important;
    --editable-input-color: ${({ theme }) =>
      theme.vars.palette.text.primary} !important;
    --editable-input-box-shadow: inset 0 0 0 1px
      ${({ theme }) => theme.vars.palette.divider} !important;
  }
`;

const ElevatedPopper = styled(Popper)`
  z-index: 100;
`;

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (props, ref) => {
    const { t } = useTranslation();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const swatchRef = useRef<HTMLButtonElement>(null);
    const value = props.value ?? '';
    const open = Boolean(anchor);
    const swatchName =
      props.label ?
        t('colorPicker.pickColorFor', { label: props.label })
      : t('colorPicker.pickColor');

    const close = () => {
      setAnchor(null);
      swatchRef.current?.focus();
    };

    const focusPalette = (palette: HTMLDivElement | null) => {
      palette?.querySelector<HTMLInputElement>('input')?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };

    return (
      <Box
        onKeyDown={handleKeyDown}
        sx={{
          position: 'relative',
          display: 'flex',
          flexFlow: 'row wrap',
          columnGap: 1,
          alignItems: 'center',
        }}
      >
        <IconButtonTooltip caption={swatchName}>
          <Box
            component="button"
            type="button"
            ref={swatchRef}
            disabled={props.disabled}
            aria-label={swatchName}
            aria-haspopup="dialog"
            aria-expanded={open}
            sx={theme => ({
              width: 25,
              height: 25,
              p: 0,
              cursor: props.disabled ? 'default' : 'pointer',
              borderRadius: `3px`,
              bgcolor: value || '#000',
              border: `1px solid ${theme.vars.palette.divider}`,
            })}
            onClick={event => setAnchor(open ? null : event.currentTarget)}
          />
        </IconButtonTooltip>

        <TextField
          ref={ref}
          name={props.name}
          value={value}
          onBlur={props.onBlur}
          onChange={props.onChange}
          type="text"
          disabled={props.disabled}
          error={!!props.error}
          label={props.label}
        />

        {(props.error?.message || props.helperText) && (
          <FormHelperText
            sx={{ width: '100%' }}
            error={!!props.error}
          >
            {props.error?.message ?? props.helperText}
          </FormHelperText>
        )}

        <ElevatedPopper
          open={open}
          anchorEl={anchor}
          placement="bottom-start"
          disablePortal
          popperOptions={{ strategy: 'fixed' }}
        >
          <ClickAwayListener onClickAway={() => setAnchor(null)}>
            <Palette
              ref={focusPalette}
              role="dialog"
              aria-label={t('colorPicker.pickColor')}
            >
              <Sketch
                color={value}
                presetColors={props.presetColors}
                style={
                  {
                    '--sketch-background':
                      'var(--mui-palette-background-paper)',
                    '--sketch-box-shadow':
                      'var(--mui-palette-divider) 0 0 0 1px, rgb(0 0 0 / 25%) 0 8px 16px',
                    '--sketch-swatch-box-shadow':
                      'var(--mui-palette-divider) 0 0 0 1px inset',
                    '--sketch-alpha-box-shadow':
                      'var(--mui-palette-divider) 0 0 0 1px inset',
                    '--sketch-swatch-border-top':
                      '1px solid var(--mui-palette-divider)',
                  } as CSSProperties
                }
                onChange={color => {
                  props.onChange({
                    target: { value: color.hexa },
                  } as ChangeEvent<HTMLInputElement>);
                }}
              />
            </Palette>
          </ClickAwayListener>
        </ElevatedPopper>
      </Box>
    );
  }
);
