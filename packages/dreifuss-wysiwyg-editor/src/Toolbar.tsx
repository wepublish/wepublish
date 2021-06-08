import React from 'react'
import {
  H1,
  H2,
  H3,
  H4,
  Bold,
  Italic,
  Underline,
  BlockCode,
  BlockQuote,
  AlignLeft,
  AlignRight,
  AlignCenter,
  AlignJustify,
  StrikeThrough,
  Superscript,
  Subscript,
  //   FileImage,
  ListOL,
  ListUL,
  BorderAll,
  BorderBottom,
  BorderClear,
  BorderLeft,
  BorderRight,
  BorderTop,
  Emoji,
  Link
} from './Icons'
import {
  ELEMENT_ALIGN_CENTER,
  ELEMENT_ALIGN_JUSTIFY,
  ELEMENT_ALIGN_RIGHT
} from '@udecode/slate-plugins-alignment'
import Popover from './atoms/Popover'
import {EmojiPicker} from './atoms/EmojiPicker'
import {LinkToolbar} from './packages/LinkToolbar'
import {TableColorPicker} from './atoms/TableColorPicker'
import {ToolbarList} from '@udecode/slate-plugins-list-ui'
import {ToolbarTable} from '@udecode/slate-plugins-table-ui'
import {ToolbarAlign} from '@udecode/slate-plugins-alignment-ui'
import {ELEMENT_OL, ELEMENT_UL} from '@udecode/slate-plugins-list'
import {ELEMENT_CODE_BLOCK} from '@udecode/slate-plugins-code-block'
import {ELEMENT_BLOCKQUOTE} from '@udecode/slate-plugins-block-quote'
import {ToolbarCodeBlock} from '@udecode/slate-plugins-code-block-ui'
import {ToolbarElement, ToolbarMark} from '@udecode/slate-plugins-toolbar'
import {useSlatePluginType, useStoreEditor} from '@udecode/slate-plugins-core'
import {QuotationMarksPicker} from '@wepublish/dreifuss-plugins/packages/quotation-marks'
import {ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4} from '@udecode/slate-plugins-heading'
import {
  insertTable,
  deleteColumn,
  deleteRow,
  deleteTable,
  addColumn,
  addRow
} from '@udecode/slate-plugins-table'
import {
  MARK_BOLD,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_SUBSCRIPT,
  MARK_SUPERSCRIPT,
  MARK_UNDERLINE
} from '@udecode/slate-plugins-basic-marks'

export const ToolbarLink = () => (
  <Popover Icon={<ToolbarElement type="" icon={<Link />} />}>
    <LinkToolbar />
  </Popover>
)

export const ToolbarEmoji = () => {
  const editor = useStoreEditor()

  return (
    <Popover Icon={<ToolbarElement type="" icon={<Emoji />} />}>
      <EmojiPicker setEmoji={emoji => editor?.insertText(emoji)} />
    </Popover>
  )
}

export const ToolbarQuotationMarks = ({editorId}: {editorId: string}) => (
  <Popover Icon={<ToolbarElement type="" icon={'<<>>'} />}>
    <QuotationMarksPicker editorId={editorId} />
  </Popover>
)

export const ToolbarButtonsBasicElements = () => (
  <>
    <ToolbarElement type={useSlatePluginType(ELEMENT_H1)} icon={<H1 />} />
    <ToolbarElement type={useSlatePluginType(ELEMENT_H2)} icon={<H2 />} />
    <ToolbarElement type={useSlatePluginType(ELEMENT_H3)} icon={<H3 />} />
    <ToolbarElement type={useSlatePluginType(ELEMENT_H4)} icon={<H4 />} />
    <ToolbarElement type={useSlatePluginType(ELEMENT_BLOCKQUOTE)} icon={<BlockQuote />} />
    <ToolbarCodeBlock type={useSlatePluginType(ELEMENT_CODE_BLOCK)} icon={<BlockCode />} />
  </>
)

export const ToolbarButtonsList = () => (
  <>
    <ToolbarList type={useSlatePluginType(ELEMENT_UL)} icon={<ListUL />} />
    <ToolbarList type={useSlatePluginType(ELEMENT_OL)} icon={<ListOL />} />
  </>
)

export const ToolbarButtonsAlign = () => (
  <>
    <ToolbarAlign icon={<AlignLeft />} />
    <ToolbarAlign type={useSlatePluginType(ELEMENT_ALIGN_CENTER)} icon={<AlignCenter />} />
    <ToolbarAlign type={useSlatePluginType(ELEMENT_ALIGN_RIGHT)} icon={<AlignRight />} />
    <ToolbarAlign type={useSlatePluginType(ELEMENT_ALIGN_JUSTIFY)} icon={<AlignJustify />} />
  </>
)

export const ToolbarButtonsBasicMarks = () => {
  return (
    <>
      <ToolbarMark type={useSlatePluginType(MARK_BOLD)} icon={<Bold />} />
      <ToolbarMark type={useSlatePluginType(MARK_ITALIC)} icon={<Italic />} />
      <ToolbarMark type={useSlatePluginType(MARK_UNDERLINE)} icon={<Underline />} />
      <ToolbarMark type={useSlatePluginType(MARK_STRIKETHROUGH)} icon={<StrikeThrough />} />
      {/* <ToolbarMark type={useSlatePluginType(MARK_CODE)} icon={<CodeAlt />} />
      <ToolbarMark type={useSlatePluginType(MARK_KBD)} icon={<Keyboard />} /> */}
      <ToolbarMark
        type={useSlatePluginType(MARK_SUPERSCRIPT)}
        clear={useSlatePluginType(MARK_SUBSCRIPT)}
        icon={<Superscript />}
      />
      <ToolbarMark
        type={useSlatePluginType(MARK_SUBSCRIPT)}
        clear={useSlatePluginType(MARK_SUPERSCRIPT)}
        icon={<Subscript />}
      />
    </>
  )
}

export const ToolbarButtonsTable = () => (
  <>
    <ToolbarTable icon={<BorderAll />} transform={insertTable} />
    <ToolbarTable icon={<BorderClear />} transform={deleteTable} />
    <ToolbarTable icon={<BorderBottom />} transform={addRow} />
    <ToolbarTable icon={<BorderTop />} transform={deleteRow} />
    <ToolbarTable icon={<BorderLeft />} transform={addColumn} />
    <ToolbarTable icon={<BorderRight />} transform={deleteColumn} />
    <TableColorPicker></TableColorPicker>
  </>
)

// export const BallonToolbarMarks = () => {
//   const arrow = false;
//   const theme = 'dark';
//   const direction = 'top';
//   const hiddenDelay = 0;
//   const tooltip: TippyProps = {
//     arrow: true,
//     delay: 0,
//     duration: [200, 0],
//     hideOnClick: false,
//     offset: [0, 17],
//     placement: 'top',
//   };

//   return (
//     <BalloonToolbar
//       direction={direction}
//       hiddenDelay={hiddenDelay}
//       theme={theme}
//       arrow={arrow}
//     >
//       <ToolbarMark
//         type={useSlatePluginType(MARK_BOLD)}
//         icon={<Bold />}
//         tooltip={{ content: 'Bold (⌘B)', ...tooltip }}
//       />
//       <ToolbarMark
//         type={useSlatePluginType(MARK_ITALIC)}
//         icon={<Italic />}
//         tooltip={{ content: 'Italic (⌘I)', ...tooltip }}
//       />
//       <ToolbarMark
//         type={useSlatePluginType(MARK_UNDERLINE)}
//         icon={<Underlined />}
//         tooltip={{ content: 'Underline (⌘U)', ...tooltip }}
//       />
//     </BalloonToolbar>
//   );
// };
