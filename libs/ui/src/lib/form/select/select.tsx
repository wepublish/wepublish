import {FormControl, FormHelperText, InputLabel, MenuItem, Select} from '@mui/material'
import {useId} from 'react'
import {InputComponentProps} from '@wepublish/website/form-builder'
import * as v from 'valibot'

export const SELECT_BRANDING = 'select'
export const SelectInputSchema = v.pipe(v.string(), v.brand(SELECT_BRANDING))

export function SelectInput({
  field,
  fieldState: {error},
  description,
  title,
  name,
  items
}: InputComponentProps & {items?: {value: string; label: string}[]}) {
  const id = useId()
  // const enums = useExtractEnumValues() ?? [] // @TODO:
  const enums = [] as any[]

  const options = items ?? enums.map(val => ({value: val, label: val}))
  const helperText = error?.message ?? description

  return (
    <FormControl fullWidth>
      <InputLabel id={id}>{title}</InputLabel>

      <Select
        {...field}
        value={field.value ?? ''}
        label={title}
        labelId={id}
        error={!!error}
        onChange={e => field.onChange(e.target.value)}>
        {options.map(item => (
          <MenuItem value={item.value}>{item.label}</MenuItem>
        ))}
      </Select>

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  )
}
