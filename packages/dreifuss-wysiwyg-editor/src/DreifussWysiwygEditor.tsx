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
  ToolbarLink,
  ToolbarQutationMarks
} from './Toolbar'
import {ReactEditor} from 'slate-react'
import {HistoryEditor} from 'slate-history'
import Divider, {DividerType} from './atoms/Divider'
// import { Editor, Node} from 'slate'
// import {toArray} from 'lodash'

type TEditor = SPEditor & ReactEditor & HistoryEditor

export interface EditableProps {
  displayOnly?: boolean
  showCharCount?: boolean
  displayOneLine?: boolean
  disabled?: boolean
  onChange?: React.Dispatch<React.SetStateAction<V>>
}

export default function DreifussWysiwygEditor(props: any) {
  const components = createSlatePluginsComponents()
  const options = createSlatePluginsOptions()

  // if(props.displayOneLine){
  //   console.log("hi")
  //   console.log(props.initialValue[0])
  //   if(props.initialValue.length > 10){
  //     console.log("hiiiiiiiii")
  //     props.initialValue = props.initialValue.slice(0, 1) + '...'
  //   }
  // }

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
          // color: 'red'
          // whiteSpace: 'nowrap',
          // overflow: 'hidden',
          // textOverflow: 'ellipsis'
          // height: '50px',
          // display: 'inline-block;',
          height:'100px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
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
  ]

  return (
    <SlatePlugins
      id="main"
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
          <Divider type={DividerType.vertical} />
          <ToolbarQutationMarks />
        </HeadingToolbar>
      )}
    </SlatePlugins>
  )
}
