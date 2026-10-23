import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { ControllerRenderProps, FieldError } from 'react-hook-form';

export type BirthdayFieldProps = {
  field: ControllerRenderProps;
  error?: FieldError;
  label: string;
};

export function BirthdayField({ field, error, label }: BirthdayFieldProps) {
  return (
    <MobileDatePicker
      {...field}
      value={field.value ? new Date(field.value) : null}
      onClose={field.onBlur}
      label={label}
      format="PP"
      openTo="year"
      views={['year', 'month', 'day']}
      disableFuture
      slotProps={{
        field: { clearable: true, ref: field.ref },
        textField: {
          error: !!error,
          helperText: error?.message,
        },
      }}
    />
  );
}
