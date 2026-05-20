import styled from '@emotion/styled';
import { Box, ClickAwayListener, Popper, TextField } from '@mui/material';
import { Sketch } from '@uiw/react-color';
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  useRef,
  useState,
} from 'react';
import { FieldError } from 'react-hook-form';

type ColorPickerProps = {
  name: string;
  label: string;
  value: string;
  onBlur: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: FieldError;
};

const ElevatedPopper = styled(Popper)`
  z-index: 100;
`;

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (props, ref) => {
    const boxRef = useRef<HTMLElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <Box
        ref={boxRef}
        sx={{
          position: 'relative',
          display: 'flex',
          flexFlow: 'row wrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Box
          sx={theme => ({
            width: 25,
            height: 25,
            cursor: 'pointer',
            borderRadius: `3px`,
            bgcolor: props.value ?? '#000',
            border: `1px solid ${theme.palette.divider}`,
          })}
          onClick={() => setOpen(true)}
        />

        <TextField
          ref={ref}
          value={props.value}
          onBlur={props.onBlur}
          onChange={props.onChange}
          size="small"
          type="text"
          error={!!props.error}
          label={props.label}
          // helperText={
          //   error?.message || (
          //     <Trans i18nKey="websiteSettings.analytics.google.gaLocator" />
          //   )
          // }
        />

        <ElevatedPopper
          open={open}
          anchorEl={boxRef.current}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Sketch
              color={props.value}
              onChange={color => {
                // props.onChange({ target: color.hex });
              }}
            />
          </ClickAwayListener>
        </ElevatedPopper>
      </Box>
    );
  }
);
