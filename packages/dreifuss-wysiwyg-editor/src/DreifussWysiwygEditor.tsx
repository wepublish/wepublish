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
import {ToolbarImage} from '@udecode/slate-plugins-image-ui'
import {
  ToolbarButtonsAlign,
  ToolbarButtonsBasicElements,
  ToolbarButtonsBasicMarks,
  ToolbarButtonsList,
  ToolbarButtonsTable,
  ToolbarEmoji,
  ToolbarLink,
  ToolbarQuotationMarks
} from './Toolbar'

type TEditor = SPEditor & ReactEditor & HistoryEditor

export interface EditableProps {
  displayOnly?: boolean
  showCharCount?: boolean
  displayOneLine?: boolean
  disabled?: boolean
  onChange?: React.Dispatch<React.SetStateAction<V>>
}

function Imagee(props: any) {
  return <h1>Hi</h1>
}

export default function DreifussWysiwygEditor(props: any) {
  const components = createSlatePluginsComponents()
  const options = createSlatePluginsOptions()

  const editableProps = {
    placeholder: "What's on your mind?",
    spellCheck: false,
    autoFocus: true,
    readOnly: props.displayOnly ?? props.disabled ?? false,
    style: props.displayOneLine
      ? {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: 'inherit'
        }
      : {}
  }

  const plugins = [
    ...createBasicElementPlugins(),
    createReactPlugin(),
    createHistoryPlugin(),
    createLinkPlugin(),
    createListPlugin(),
    createBoldPlugin(),
    createCodePlugin(),
    createAlignPlugin(),
    createImagePlugin(),
    createTablePlugin(),
    createItalicPlugin(),
    createTodoListPlugin(),
    createParagraphPlugin(),
    createHighlightPlugin(),
    createCodeBlockPlugin(),
    createUnderlinePlugin(),
    createSubscriptPlugin(),
    createMediaEmbedPlugin(),
    createBlockquotePlugin(),
    createSuperscriptPlugin(),
    createStrikethroughPlugin(),
    createHeadingPlugin({levels: 3})
  ]

  return (
    <SlatePlugins
      id={props.id ?? 'main'}
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
          <ToolbarImage icon={<Imagee />} />
          <ToolbarButtonsTable />
          <Divider type={DividerType.vertical} />
          <ToolbarLink />
          <ToolbarEmoji />
          <Divider type={DividerType.vertical} />
          <ToolbarQuotationMarks editorId={props.id ?? 'main'} />
        </HeadingToolbar>
      )}
      {props.showCharCount && (
        <p style={{textAlign: 'right'}}>
          {'Characters count:'} <CharCount editorId={props.id ?? 'main'} />
        </p>
      )}
    </SlatePlugins>
  )
}
