import {forwardRef} from 'react'
import {Input} from 'rsuite'

export type TextareaProps = {
  rows: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => (
  <Input {...props} as="textarea" ref={ref} />
))
