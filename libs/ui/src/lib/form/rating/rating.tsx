import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useDescription,
  useNumberFieldInfo,
  useTsController
} from '@ts-react/form'
import {z} from 'zod'

import {Rating} from '../../rating/rating'
import {FormControl, FormHelperText} from '@mui/material'

const RATING_BRANDING = 'rating'

export const RatingInputSchema = createUniqueFieldSchema(z.number().min(1).max(5), RATING_BRANDING)

export const createRatingInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(zodEffect.brand(RATING_BRANDING), RATING_BRANDING)

export function RatingInput() {
  const {error, field} = useTsController<number>()
  const {maxValue} = useNumberFieldInfo()
  const {label, placeholder} = useDescription()

  const helperText = error?.errorMessage ?? placeholder

  return (
    <FormControl fullWidth>
      {label && <label>{label}</label>}

      <Rating
        {...field}
        max={maxValue}
        value={field.value ?? 0}
        onChange={(_, value) => field.onChange(value ?? 1)}
      />

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  )
}
