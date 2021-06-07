import React, {useEffect, useState} from 'react'
import {Node} from 'slate'
import {toArray} from 'lodash'
import {useSlatePluginsStore} from '@udecode/slate-plugins-core'

const getTextString = (editor: any) => {
  // get all text nodes and append them to each other in one string
  return [...Node.texts(editor)].reduce((string, nodePair, index) => {
    const [textNode] = nodePair
    if (index === 0) return `${textNode.text}`
    return `${string} ${textNode.text}`
  }, '')
}

const calculateEditorCharCount = (editor: any) => {
  // using lodash toArray to get correct length for characters like emojis
  return toArray(getTextString(editor)).length
}

export const CharCount = ({editorId}: {editorId: string}) => {
  const [charCount, setCharCount] = useState(0)

  const dreifussStore = useSlatePluginsStore()

  const editor = dreifussStore[editorId]?.editor

  if (!editor) {
    return null
  }

  useEffect(() => {
    setCharCount(calculateEditorCharCount(editor))
  }, [editor?.children])

  return <span>{charCount}</span>
}
