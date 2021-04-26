import React, {useMemo} from 'react'
import {createAlignPlugin} from '@udecode/slate-plugins-alignment'
import {createSlatePluginsComponents, createSlatePluginsOptions} from '@udecode/slate-plugins'
import {
  createBoldPlugin,
  createItalicPlugin,
  createCodePlugin,
  createUnderlinePlugin
} from '@udecode/slate-plugins-basic-marks'
import {createBlockquotePlugin} from '@udecode/slate-plugins-block-quote'
import {createCodeBlockPlugin} from '@udecode/slate-plugins-code-block'
import {
  SlatePlugins,
  createHistoryPlugin,
  createReactPlugin,
  SlatePlugin
} from '@udecode/slate-plugins-core'
import {useFindReplacePlugin} from '@udecode/slate-plugins-find-replace'
import {createHeadingPlugin, ELEMENT_H1, ELEMENT_H2} from '@udecode/slate-plugins-heading'
import {createHighlightPlugin} from '@udecode/slate-plugins-highlight'
import {createDeserializeHTMLPlugin} from '@udecode/slate-plugins-html-serializer'
import {createImagePlugin, ELEMENT_IMAGE} from '@udecode/slate-plugins-image'
import {ToolbarImage} from '@udecode/slate-plugins-image-ui'
import {createLinkPlugin} from '@udecode/slate-plugins-link'
import {createListPlugin, createTodoListPlugin} from '@udecode/slate-plugins-list'
import {createMediaEmbedPlugin} from '@udecode/slate-plugins-media-embed'
import {createNormalizeTypesPlugin} from '@udecode/slate-plugins-normalizers'
import {createParagraphPlugin, ELEMENT_PARAGRAPH} from '@udecode/slate-plugins-paragraph'
import {createSelectOnBackspacePlugin} from '@udecode/slate-plugins-select'
import {createTablePlugin} from '@udecode/slate-plugins-table'
import {HeadingToolbar} from '@udecode/slate-plugins-toolbar'
import {createTrailingBlockPlugin} from '@udecode/slate-plugins-trailing-block'
import {
  ToolbarButtonsAlign,
  ToolbarButtonsBasicElements,
  ToolbarButtonsBasicMarks,
  ToolbarButtonsList,
  ToolbarButtonsTable
} from './Toolbar'
import {H1} from './SlateIcons'
export const editableProps = {
  // placeholder: 'Enter some rich text…',
  spellCheck: false,
  autoFocus: true
}

enum DividerType {
  horizontal = 'Horizontal',
  vertical = 'Vertical'
}
interface DividerProps {
  type: DividerType
}

const Divider = (props: DividerProps) => (
  <hr
    style={{
      margin: props.type === DividerType.vertical ? '0 10px' : '10px 0',
      height: props.type === DividerType.vertical ? '22px' : undefined,
      borderLeft: '1px solid black'
    }}
  />
)

export function WysiwygEditor(props: any) {
  const components = createSlatePluginsComponents()
  const options = createSlatePluginsOptions()

  const initialValueBasicElements: any = [
    {
      type: options[ELEMENT_H1].type,
      children: [{text: '🧱 Elements'}]
    },
    {
      type: options[ELEMENT_H2].type,
      children: [{text: '🔥 Basic Elements'}]
    }
  ]

  const {setSearch, plugin: searchHighlightPlugin} = useFindReplacePlugin()
  //   const { getMentionSelectProps, plugin: mentionPlugin } = useMentionPlugin(
  //     optionsMentionPlugin
  //   );

  const pluginsMemo: SlatePlugin[] = useMemo(() => {
    const plugins = [
      createReactPlugin(),
      createHistoryPlugin(),
      createParagraphPlugin(),
      createBlockquotePlugin(),
      createTodoListPlugin(),
      createHeadingPlugin(),
      createImagePlugin(),
      createLinkPlugin(),
      createListPlugin(),
      createTablePlugin(),
      createMediaEmbedPlugin(),
      createCodeBlockPlugin(),
      createAlignPlugin(),
      createBoldPlugin(),
      createCodePlugin(),
      createItalicPlugin(),
      createHighlightPlugin(),
      createUnderlinePlugin(),
      createNormalizeTypesPlugin({
        rules: [{path: [0, 0], strictType: options[ELEMENT_H1].type}]
      }),
      createTrailingBlockPlugin({
        type: options[ELEMENT_PARAGRAPH].type,
        level: 1
      }),
      createSelectOnBackspacePlugin({allow: options[ELEMENT_IMAGE].type}),
      //   mentionPlugin,
      searchHighlightPlugin
    ]
    //@ts-ignore
    plugins.push(createDeserializeHTMLPlugin({plugins}))

    return plugins
  }, [options, searchHighlightPlugin])

  return (
    <SlatePlugins
      id="3"
      onChange={value => {
        // console.log(value);
      }}
      plugins={pluginsMemo}
      components={components}
      options={options}
      editableProps={editableProps}
      initialValue={props.value || initialValueBasicElements}>
      <HeadingToolbar>
        <ToolbarButtonsBasicElements />
        <Divider type={DividerType.vertical} />
        <ToolbarButtonsList />
        <Divider type={DividerType.vertical} />
        <ToolbarButtonsBasicMarks />
        <Divider type={DividerType.vertical} />
        <ToolbarButtonsAlign />
        <Divider type={DividerType.vertical} />
        {/* <ToolbarLink icon={<Link />} /> */}
        {/* TODO: icon to be changed */}
        <ToolbarImage icon={<H1 />} />
        <ToolbarButtonsTable />
      </HeadingToolbar>
    </SlatePlugins>
  )
}

export default WysiwygEditor
