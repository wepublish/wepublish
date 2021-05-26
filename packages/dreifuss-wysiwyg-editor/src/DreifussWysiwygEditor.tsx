import React from 'react'
import {createBasicElementPlugins, SPEditor} from '@udecode/slate-plugins'
import {createAlignPlugin} from '@udecode/slate-plugins-alignment'
import {createSlatePluginsOptions} from './utils/createSlatePluginsOptions'
import {createSlatePluginsComponents} from './utils/createSlatePluginsComponents'
import {
  createBoldPlugin,
  createItalicPlugin,
  createCodePlugin,
  createUnderlinePlugin,
  createStrikethroughPlugin,
  createSubscriptPlugin,
  createSuperscriptPlugin
} from '@udecode/slate-plugins-basic-marks'
import {createBlockquotePlugin} from '@udecode/slate-plugins-block-quote'
import {createCodeBlockPlugin} from '@udecode/slate-plugins-code-block'
import {SlatePlugins, createHistoryPlugin, createReactPlugin} from '@udecode/slate-plugins-core'
import {createHeadingPlugin} from '@udecode/slate-plugins-heading'
import {createHighlightPlugin} from '@udecode/slate-plugins-highlight'
import {createImagePlugin} from '@udecode/slate-plugins-image'
// import {ToolbarImage} from '@udecode/slate-plugins-image-ui'
import {createLinkPlugin} from '@udecode/slate-plugins-link'
import {createListPlugin, createTodoListPlugin} from '@udecode/slate-plugins-list'
import {createMediaEmbedPlugin} from '@udecode/slate-plugins-media-embed'
// import {createNormalizeTypesPlugin} from '@udecode/slate-plugins-normalizers'
import {createParagraphPlugin} from '@udecode/slate-plugins-paragraph'
import {createTablePlugin} from '@udecode/slate-plugins-table'
import {HeadingToolbar} from '@udecode/slate-plugins-toolbar'
import {
  ToolbarButtonsAlign,
  ToolbarButtonsBasicElements,
  ToolbarButtonsBasicMarks,
  ToolbarButtonsList,
  ToolbarButtonsTable,
  ToolbarEmoji,
  ToolbarLink
} from './Toolbar'
import {ReactEditor} from 'slate-react'
import {HistoryEditor} from 'slate-history'
import Divider, {DividerType} from './atoms/Divider'

type TEditor = SPEditor & ReactEditor & HistoryEditor

export interface EditableProps {
  displayOnly?: boolean
  showCharCount?: boolean
  displayOneLine?: boolean
  disabled?: boolean
  onChange?: React.Dispatch<React.SetStateAction<V>>
}

// export const editableProps = {
//   // placeholder: 'Enter some rich text…',
//   spellCheck: false,
//   autoFocus: true,
//   // displayOnly: false,
//   // displayOneLine: false,
//   // showCharCount: false,
//   readOnly: true
// }

// const charCount = editor => {
//   // const { isVoid } = editor

//   // editor.isVoid = element => {
//   //   return element.type === 'image' ? true : isVoid(element)
//   // }

//   return editor.length
// }

// const editor = charCount(createEditor())

export default function DreifussWysiwygEditor(props: any) {
  const components = createSlatePluginsComponents()
  const options = createSlatePluginsOptions()
  const charCount = 10

  const editableProps = {
    // placeholder: 'Enter some rich text…',
    spellCheck: false,
    autoFocus: true,
    showCount: props.showCharCount ?? false,
    readOnly: props.displayOnly ?? props.disabled ?? false,
    style: props.displayOneLine
      ? {
          // whiteSpace: 'nowrap',
          // overflow: 'hidden',
          // textOverflow: 'ellipsis',
          color: 'red'
        }
      : {}
  }

  const plugins = [
    ...createBasicElementPlugins(),
    createReactPlugin(),
    createHistoryPlugin(),
    createParagraphPlugin(),
    createBlockquotePlugin(),
    createTodoListPlugin(),
    createHeadingPlugin({levels: 3}),
    createImagePlugin(),
    createLinkPlugin(),
    createListPlugin(),
    createTablePlugin(),
    createMediaEmbedPlugin(),
    createCodeBlockPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createUnderlinePlugin(),
    createAlignPlugin(),
    createCodePlugin(),
    createImagePlugin(),
    createHighlightPlugin(),
    createUnderlinePlugin(),
    createStrikethroughPlugin(),
    createSubscriptPlugin(),
    createSuperscriptPlugin()
    //   createNormalizeTypesPlugin({
    //     rules: [{path: [0, 0], strictType: options[ELEMENT_H1].type}]
    //   }),
    //   createTrailingBlockPlugin({
    //     type: options[ELEMENT_PARAGRAPH].type,
    //     level: 1
    //   }),
    //   createSelectOnBackspacePlugin({allow: options[ELEMENT_IMAGE].type})
  ]

  return (
    <SlatePlugins
      id="3"
      onChange={props.onChange}
      plugins={plugins}
      components={components}
      options={options}
      editableProps={editableProps}
      initialValue={props.value || props.initialValue}>
      {!props.displayOnly && (
        <HeadingToolbar>
          <ToolbarButtonsBasicElements />
          <Divider type={DividerType.vertical} />
          <ToolbarButtonsList />
          <Divider type={DividerType.vertical} />
          <ToolbarButtonsBasicMarks />
          <Divider type={DividerType.vertical} />
          <ToolbarButtonsAlign />
          <Divider type={DividerType.vertical} />
          {/* TODO: icon to be changed */}
          {/* <ToolbarImage icon={<H1 />} /> */}
          <ToolbarButtonsTable />
          <Divider type={DividerType.vertical} />
          <ToolbarLink />
          <ToolbarEmoji />
        </HeadingToolbar>
      )}
      {editableProps.showCount && <p style={{textAlign: 'right'}}>{charCount}</p>}
    </SlatePlugins>
  )
}
