import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useDescription,
  useTsController
} from '@ts-react/form'

import {FormControl, FormHelperText, InputLabel, MenuItem, Select} from '@mui/material'
import {useId} from 'react'
import {z} from 'zod'
import {useExtractEnumValues} from '../hooks'

const SELECT_BRANDING = 'select'
export const SelectInputSchema = createUniqueFieldSchema(z.string(), SELECT_BRANDING)
export const createSelectInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(zodEffect.brand(SELECT_BRANDING), SELECT_BRANDING)

export function SelectInput({items}: {items?: {value: string; label: string}[]}) {
  const id = useId()
  const {field, error} = useTsController<string>()
  const {label, placeholder} = useDescription()
  const enums = useExtractEnumValues() ?? []

  const options = items ?? enums.map(val => ({value: val, label: val}))
  const helperText = error?.errorMessage ?? placeholder

  return (
    <FormControl fullWidth>
      <InputLabel id={id}>{label}</InputLabel>

      <Select
        {...field}
        value={field.value ?? ''}
        label={label}
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
