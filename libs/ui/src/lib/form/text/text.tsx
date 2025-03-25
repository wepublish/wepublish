import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'

export function TextInput({
  field,
  fieldState: {error},
  description,
  title,
  name
}: InputComponentProps) {
  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      fullWidth
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
