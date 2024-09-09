import {useDescription, useTsController} from '@ts-react/form'

import {TextField} from '../../text-field/text-field'

export function TextInput() {
  const {field, error} = useTsController<string>()
  const {label, placeholder} = useDescription()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      fullWidth
      label={label}
      error={!!error}
      helperText={error?.errorMessage ?? placeholder}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
