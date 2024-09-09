import {createUniqueFieldSchema} from '@ts-react/form'
import {ReactElement} from 'react'
import {z} from 'zod'

export const HiddenInputSchema = createUniqueFieldSchema(z.string(), 'hidden')

export function HiddenInput(): ReactElement {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>
}
