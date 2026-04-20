import { Box, TextField } from '@mui/material';
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  useRef,
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

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (props, ref) => {
    const colorRef = useRef<HTMLInputElement>(null);

    return (
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexFlow: 'row wrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <input
          type="color"
          value={props.value}
          onBlur={props.onBlur}
          onChange={props.onChange}
          css={{
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
          ref={colorRef}
        />

        <Box
          onClick={() => colorRef.current?.click()}
          sx={theme => ({
            width: 25,
            height: 25,
            cursor: 'pointer',
            borderRadius: `3px`,
            bgcolor: props.value ?? '#000',
            border: `1px solid ${theme.palette.divider}`,
          })}
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
      </Box>
    );
  }
);
