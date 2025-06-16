'use client'

import {useAIChatEditor} from '@platejs/ai/react'
import {usePlateEditor} from 'platejs/react'

import {BaseEditorKit} from '../editor/editor-base-kit'

import {EditorStatic} from './editor-static'
import {memo} from 'react'

export const AIChatEditor = memo(function AIChatEditor({content}: {content: string}) {
  const aiEditor = usePlateEditor({
    plugins: BaseEditorKit
  })

  useAIChatEditor(aiEditor, content)

  return <EditorStatic variant="aiChat" editor={aiEditor} />
})
