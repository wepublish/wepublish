'use client'

import {insertInlineEquation} from '@platejs/math'
import {RadicalIcon} from 'lucide-react'
import {useEditorRef} from 'platejs/react'

import {ToolbarButton} from './toolbar'
import {ComponentProps} from 'react'

export function InlineEquationToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef()

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor)
      }}
      tooltip="Mark as equation">
      <RadicalIcon />
    </ToolbarButton>
  )
}
