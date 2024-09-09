import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useDescription,
  useTsController
} from '@ts-react/form'

import {Autocomplete} from '@mui/material'
import {useMemo} from 'react'
import {z} from 'zod'
import {useExtractEnumValues} from '../hooks'
import {TextField} from '../../text-field/text-field'

const TAG_BRANDING = 'tag'
export const TagInputSchema = createUniqueFieldSchema(z.array(z.string()), TAG_BRANDING)
export const createTagInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(zodEffect.brand(TAG_BRANDING), TAG_BRANDING)

export function TagInput({items}: {items?: {value: string; label: string}[]}) {
  const {field, error} = useTsController<string[]>()
  const {label, placeholder} = useDescription()
  const enums = useExtractEnumValues()

  const options = useMemo(
    () => items ?? enums?.map(val => ({value: val, label: val})) ?? [],
    [enums, items]
  )

  const value = useMemo(() => {
    return options.filter(({value}) => field.value?.includes(value))
  }, [field.value, options])

  return (
    <Autocomplete
      multiple
      fullWidth
      value={value}
      options={options}
      getOptionLabel={option => option.label}
      onChange={(_e, newValue) => field.onChange(newValue.map(({value}) => value))}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error?.errorMessage ?? placeholder}
        />
      )}
    />
  )
}
