import {Box} from '@mui/material'

import {Button} from '../../button/button'
import {MdDelete} from 'react-icons/md'
import {IconButton} from '../../icon-button/icon-button'
import {remove, update} from 'ramda'
import {ComponentProps, memo} from 'react'
import {SubForm} from './sub-form'
import {InputComponentProps, isArraySchema} from '@wepublish/website/form-builder'
import styled from '@emotion/styled'
import * as v from 'valibot'

const ArrayInputWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-items: start;
`

export const ArrayInput = memo(
  <T extends object>({
    field,
    fieldState,
    description,
    name,
    schema,
    title,
    getSubFormProps,
    getDefaultItem
  }: {
    getDefaultItem?: () => T
    getSubFormProps?: (item: T) => Partial<ComponentProps<typeof SubForm>>
  } & InputComponentProps<v.ArraySchema<any, any>>) => {
    const elementSchema = isArraySchema(schema) && (schema.item.entries || schema.item)

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
