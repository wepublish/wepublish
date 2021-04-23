import React, {useCallback, useEffect, useMemo, useState} from 'react'
import PropTypes from 'prop-types'

// Import the Slate editor factory.
import {createEditor, BaseEditor, Transforms, Editor} from 'slate'

// Import the Slate components and React plugin.
import {Slate, Editable, withReact, ReactEditor} from 'slate-react'

type CustomElement = {type: 'paragraph'; children: CustomText[]}
type CustomText = {text: string}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor // & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const DefaultElement = props => {
  return <p {...props.attributes}>{props.children}</p>
}

const DreifussWysiwygEditor = ({title = 'Hello'}) => {
  const editor = useMemo(() => withReact(createEditor()), [])

  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{text: 'A line of text in a paragraph.'}]
    }
  ])

  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

  return (
    <Slate editor={editor} value={value} onChange={newValue => setValue(newValue)}>
      <Editable
        renderElement={renderElement}
        onKeyDown={event => {
          if (event.key === 'k' && event.ctrlKey) {
            event.preventDefault()
            // Determine whether any of the currently selected blocks are code blocks.
            const [match] = Editor.nodes(editor, {
              match: n => n.type === 'code'
            })
            // Toggle the block type depending on whether there's already a match.
            Transforms.setNodes(
              editor,
              {type: match ? 'paragraph' : 'code'},
              {match: n => Editor.isBlock(editor, n)}
            )
          }
        }}
      />
    </Slate>
  )
}

DreifussWysiwygEditor.propTypes = {
  title: PropTypes.string.isRequired
}

export default DreifussWysiwygEditor
