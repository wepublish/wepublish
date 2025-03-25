import {ReactElement} from 'react'
import * as v from 'valibot'

export const HiddenInputSchema = v.pipe(v.string(), v.brand('hidden'))

export function HiddenInput(): ReactElement {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>
}
