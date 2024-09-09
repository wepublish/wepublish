import {Checkbox, FormControl, FormControlLabel, FormHelperText} from '@mui/material'
import {useDescription, useTsController} from '@ts-react/form'

export function CheckboxInput() {
  const {field, error} = useTsController<boolean>()
  const {label, placeholder} = useDescription()

  const helperText = error?.errorMessage ?? placeholder

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
        label={label}
      />

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  )
}
