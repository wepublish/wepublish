import { Box, TextField } from '@mui/material';
import { Sketch } from '@uiw/react-color';
import { ChangeEventHandler, FocusEventHandler, forwardRef } from 'react';
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
        <Sketch
          color={props.value}
          onChange={color => {
            // props.onChange()
          }}
        />

        <Box
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
