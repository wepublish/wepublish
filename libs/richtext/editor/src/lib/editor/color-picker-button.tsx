import {
  Button,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
} from '@mui/material';
import { Sketch } from '@uiw/react-color';
import styled from '@emotion/styled';
import { ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ElevatedPopper = styled(Popper)`
  z-index: 100;
`;

const IconWithSwatch = styled('span')`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 0;
`;

const Swatch = styled('span')`
  width: 18px;
  height: 3px;
  margin-top: 2px;
  border-radius: 1px;
`;

type ColorPickerButtonProps = {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
  presetColors?: string[];
  children: ReactNode;
};

export function ColorPickerButton({
  value,
  onChange,
  presetColors,
  children,
}: ColorPickerButtonProps) {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        onClick={() => setOpen(true)}
      >
        <IconWithSwatch>
          {children}
          <Swatch style={{ backgroundColor: value ?? 'transparent' }} />
        </IconWithSwatch>
      </IconButton>

      <ElevatedPopper
        open={open}
        anchorEl={anchorRef.current}
        disablePortal
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper>
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
                setOpen(false);
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
