'use client'

import {useToggleToolbarButton, useToggleToolbarButtonState} from '@platejs/toggle/react'
import {ListCollapseIcon} from 'lucide-react'

import {ToolbarButton} from './toolbar'
import {ComponentProps} from 'react'

export function ToggleToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const state = useToggleToolbarButtonState()
  const {props: buttonProps} = useToggleToolbarButton(state)

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Toggle">
      <ListCollapseIcon />
    </ToolbarButton>
  )
}
