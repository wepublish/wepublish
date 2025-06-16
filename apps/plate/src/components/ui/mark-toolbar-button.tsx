'use client'

import {useMarkToolbarButton, useMarkToolbarButtonState} from 'platejs/react'

import {ToolbarButton} from './toolbar'
import {ComponentProps} from 'react'

export function MarkToolbarButton({
  clear,
  nodeType,
  ...props
}: ComponentProps<typeof ToolbarButton> & {
  nodeType: string
  clear?: string[] | string
}) {
  const state = useMarkToolbarButtonState({clear, nodeType})
  const {props: buttonProps} = useMarkToolbarButton(state)

  return <ToolbarButton {...props} {...buttonProps} />
}
