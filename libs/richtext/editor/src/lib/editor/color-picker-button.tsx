import {
  Button,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
} from '@mui/material';
import { Sketch } from '@uiw/react-color';
import styled from '@emotion/styled';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ElevatedPopper = styled(Popper)`
  z-index: 100;
`;

type ColorPickerButtonProps = {
  'aria-label': string;
  value: string | null | undefined;
  onChange: (color: string | null) => void;
  presetColors?: string[];
  children: ReactNode;
};

export function ColorPickerButton({
  'aria-label': ariaLabel,
  value,
  onChange,
  presetColors,
  children,
}: ColorPickerButtonProps) {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const popperId = useId();

  const dismiss = () => {
    setOpen(false);
    anchorRef.current?.focus();
  };

  useEffect(() => {
    if (open) {
      paperRef.current?.querySelector<HTMLElement>('input')?.focus();
    }
  }, [open]);

  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        aria-label={value ? `${ariaLabel}: ${value}` : ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popperId : undefined}
        onClick={() => setOpen(true)}
        onKeyDown={e => {
          if (open && e.key === 'Escape') {
            e.stopPropagation();
            dismiss();
          }
        }}
        sx={{
          border: 1,
          borderColor: value ? 'divider' : 'transparent',
          backgroundColor: value ? 'action.selected' : undefined,
        }}
      >
        {children}
      </IconButton>

      <ElevatedPopper
        id={popperId}
        role="dialog"
        aria-label={ariaLabel}
        open={open}
        anchorEl={() => anchorRef.current!}
        disablePortal
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            dismiss();
          }
        }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper ref={paperRef}>
            <Sketch
              color={value ?? undefined}
              presetColors={presetColors}
              onChange={color => onChange(color.hexa)}
              style={{ boxShadow: 'none' }}
            />

            <Button
              fullWidth
              size="small"
              disabled={!value}
              onClick={() => {
                onChange(null);
                dismiss();
              }}
            >
              {t('richtext.colorPicker.clear')}
            </Button>
          </Paper>
        </ClickAwayListener>
      </ElevatedPopper>
    </>
  );
}
