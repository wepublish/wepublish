import * as React from 'react'
import {Node} from 'slate'
import {toArray} from 'lodash'
import {useSlatePluginsStore, useStoreEditor} from '@udecode/slate-plugins-core'

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

export const ToolbarAlign = () => {
  // TODO: this one needed to listen to changes and should be used to instead of `useStoreEditor`
  // but it has key of "3"
  useSlatePluginsStore()

  const editor = useStoreEditor()
  const [charCount, setCharCount] = React.useState(0)

  React.useEffect(() => {
    setCharCount(calculateEditorCharCount(editor))
  }, [editor?.children])
  return <div>{charCount}</div>
}
