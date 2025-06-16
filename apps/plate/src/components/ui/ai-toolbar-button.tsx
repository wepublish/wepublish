'use client'

import {AIChatPlugin} from '@platejs/ai/react'
import {useEditorPlugin} from 'platejs/react'

import {ToolbarButton} from './toolbar'
import {ComponentProps} from 'react'

export function AIToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const {api} = useEditorPlugin(AIChatPlugin)

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        api.aiChat.show()
      }}
      onMouseDown={e => {
        e.preventDefault()
      }}
    />
  )
}
