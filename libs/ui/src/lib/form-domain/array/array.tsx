import {Box, styled} from '@mui/material'
import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useFieldInfo,
  useTsController
} from '@ts-react/form'

import {z} from 'zod'
import {Button} from '../../button/button'
import {MdDelete} from 'react-icons/md'
import {IconButton} from '../../icon-button/icon-button'
import {remove, update} from 'ramda'
import {deepUnwrap} from '../../form/hooks'
import {ComponentProps, memo, useMemo} from 'react'
import {SubForm} from './sub-form'

const ARRAY_BRANDING = 'array'

export const ArrayInputSchema = createUniqueFieldSchema(z.array(z.any()), ARRAY_BRANDING)
export const createArrayInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(z.array(zodEffect).brand(ARRAY_BRANDING), ARRAY_BRANDING)

const ArrayInputWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-items: start;
`

export const ArrayInput = memo(
  <T extends object, ElementSchema extends z.ZodObject<Record<keyof T, RTFSupportedZodTypes>>>({
    getSubFormProps,
    getDefaultItem
  }: {
    getDefaultItem?: () => T
    getSubFormProps?: (item: T) => Partial<ComponentProps<typeof SubForm>>
  }) => {
    const {field} = useTsController<T[]>()
    const {zodType} = useFieldInfo()

    const elementSchema = useMemo(
      () => (deepUnwrap(zodType) as z.ZodArray<ElementSchema>).element,
      [zodType]
    )

    return (
      <ArrayInputWrapper ref={field.ref}>
        <Button onClick={() => field.onChange([getDefaultItem?.() ?? {}, ...(field.value ?? [])])}>
          +
        </Button>

        {field.value?.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gap: 2,
              gridAutoFlow: 'column',
              gridAutoColumns: 'auto',
              alignItems: 'center'
            }}>
            <SubForm
              schema={elementSchema}
              defaultValues={item}
              {...getSubFormProps?.(item)}
              onSubmit={newItem => field.onChange(update(index, newItem, field.value ?? []))}
            />

            <IconButton
              color="error"
              onClick={() => field.onChange(remove(index, 1, field.value ?? []))}>
              <MdDelete />
            </IconButton>
          </Box>
        ))}
      </ArrayInputWrapper>
    )
  }
)
