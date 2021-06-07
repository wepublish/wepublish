import React from 'react'
import {ReactEditor} from 'slate-react'
import {HistoryEditor} from 'slate-history'
import Divider, {DividerType} from './atoms/Divider'
import {createLinkPlugin} from '@udecode/slate-plugins-link'
import {HeadingToolbar} from '@udecode/slate-plugins-toolbar'
import {createImagePlugin} from '@udecode/slate-plugins-image'
import {createTablePlugin} from '@udecode/slate-plugins-table'
import {createAlignPlugin} from '@udecode/slate-plugins-alignment'
import {createHeadingPlugin} from '@udecode/slate-plugins-heading'
import {createHighlightPlugin} from '@udecode/slate-plugins-highlight'
import {createParagraphPlugin} from '@udecode/slate-plugins-paragraph'
import {createCodeBlockPlugin} from '@udecode/slate-plugins-code-block'
import {createBlockquotePlugin} from '@udecode/slate-plugins-block-quote'
import {createMediaEmbedPlugin} from '@udecode/slate-plugins-media-embed'
import {createSlatePluginsOptions} from './utils/createSlatePluginsOptions'
import {createBasicElementPlugins} from '@udecode/slate-plugins-basic-elements'
import {createSlatePluginsComponents} from './utils/createSlatePluginsComponents'
import {createListPlugin, createTodoListPlugin} from '@udecode/slate-plugins-list'
import {CharCount} from '@wepublish/dreifuss-plugins/packages/character-count-ui'
import {
  createBoldPlugin,
  createItalicPlugin,
  createCodePlugin,
  createUnderlinePlugin,
  createStrikethroughPlugin,
  createSubscriptPlugin,
  createSuperscriptPlugin
} from '@udecode/slate-plugins-basic-marks'
import {
  SlatePlugins,
  createHistoryPlugin,
  createReactPlugin,
  SPEditor
} from '@udecode/slate-plugins-core'
// import {ToolbarImage} from '@udecode/slate-plugins-image-ui'
// import {createNormalizeTypesPlugin} from '@udecode/slate-plugins-normalizers'
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
      {editableProps.showCount && (
        <p style={{textAlign: 'right'}}>
          <CharCount editorId="main" />
        </p>
      )}
    </SlatePlugins>
  )
}
