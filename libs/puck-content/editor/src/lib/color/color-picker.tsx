import { Box, FormHelperText, Popover, TextField } from '@mui/material';
import { Sketch } from '@uiw/react-color';
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  ReactNode,
  useRef,
  useState,
} from 'react';
import { FieldError } from 'react-hook-form';

type ColorPickerProps = {
  name: string;
  label?: string;
  helperText?: ReactNode;
  value: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: FieldError;
};

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  function ColorPicker(props, ref) {
    const swatchRef = useRef<HTMLElement>(null);
    const [open, setOpen] = useState(false);

    return (
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexFlow: 'row wrap',
          columnGap: 1,
          alignItems: 'center',
        }}
      >
        <Box
          ref={swatchRef}
          sx={theme => ({
            width: 25,
            height: 25,
            cursor: 'pointer',
            borderRadius: `3px`,
            bgcolor: props.value ?? '#00000000',
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
        />

        <FormHelperText
          sx={{ width: '100%' }}
          error={!!props.error}
        >
          {props.error?.message ?? props.helperText}
        </FormHelperText>

        <Popover
          open={open}
          anchorEl={swatchRef.current}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { sx: { overflow: 'visible' } } }}
        >
          <Sketch
            color={props.value}
            onChange={color => {
              props.onChange({
                target: { value: color.hexa },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
        </Popover>
      </Box>
    );
  }
);
