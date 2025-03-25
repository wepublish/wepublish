import {Checkbox, FormControl, FormControlLabel, FormHelperText} from '@mui/material'
import {InputComponentProps} from '@wepublish/website/form-builder'

export function CheckboxInput({
  field,
  fieldState: {error},
  description,
  title,
  name
}: InputComponentProps) {
  const helperText = error?.message ?? description

  return (
    <FormControl fullWidth>
      <FormControlLabel
        control={
          <Checkbox
            {...field}
            checked={!!field.value}
            onChange={e => field.onChange(e.target.checked)}
            color={error ? 'error' : 'default'}
          />
        }
        label={title}
      />

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  )
}
