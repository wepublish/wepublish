import React, {useCallback, useRef, useState} from 'react'
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
  //   FileImage,
  ListOL,
  ListUL,
  BorderAll,
  BorderBottom,
  BorderClear,
  BorderLeft,
  BorderRight,
  BorderTop,
  Emoji
} from './Icons'
import {
  ELEMENT_ALIGN_CENTER,
  ELEMENT_ALIGN_JUSTIFY,
  ELEMENT_ALIGN_RIGHT
} from '@udecode/slate-plugins-alignment'
import {ToolbarAlign} from '@udecode/slate-plugins-alignment-ui'
// import {} from '@udecode/slate-plugins-autoformat'
// import {
//   BasicElementPluginsOptions,
//   createBasicElementPlugins
// } from '@udecode/slate-plugins-basic-elements'
import {
  MARK_BOLD,
  //   MARK_CODE,
  MARK_ITALIC,
  //   MARK_KBD,
  MARK_STRIKETHROUGH,
  //   MARK_SUBSCRIPT,
  //   MARK_SUPERSCRIPT,
  MARK_UNDERLINE
} from '@udecode/slate-plugins-basic-marks'
import {ELEMENT_BLOCKQUOTE} from '@udecode/slate-plugins-block-quote'
// import {BlockquoteElement} from '@udecode/slate-plugins-block-quote-ui'
import {ELEMENT_CODE_BLOCK} from '@udecode/slate-plugins-code-block'
import {ToolbarCodeBlock} from '@udecode/slate-plugins-code-block-ui'
import {useSlatePluginType, useStoreEditor} from '@udecode/slate-plugins-core'
import {ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4} from '@udecode/slate-plugins-heading'
import {ELEMENT_OL, ELEMENT_UL} from '@udecode/slate-plugins-list'
import {ToolbarList} from '@udecode/slate-plugins-list-ui'
import {
  insertTable,
  deleteColumn,
  deleteRow,
  deleteTable,
  addColumn,
  addRow
} from '@udecode/slate-plugins-table'
import {ToolbarTable} from '@udecode/slate-plugins-table-ui'
import {ToolbarElement, ToolbarMark} from '@udecode/slate-plugins-toolbar'
import {EmojiPicker} from './atoms/EmojiPicker'
import {Popover} from './atoms/Popover'

// interface SubMenuContextProps {
//   closeMenu: () => void
//   openMenu: () => void
// }

// const emtpyFn = () => {
//   /* do nothing */
// }

// // TODO: check if it's important
// export const SubMenuContext = createContext<SubMenuContextProps>({
//   closeMenu: emtpyFn,
//   openMenu: emtpyFn
// })

// export interface SubMenuButtonProps {
//   readonly children?: ReactNode
//   //   readonly format?: Format
//   readonly format?: any
//   readonly icon?: any
// }

// export const SubMenuButton = forwardRef<any, SubMenuButtonProps>(
//   ({children, icon, format}, ref) => {
//     // The Submenu buttons provides some local context to it's children.
//     const [isMenuOpen, setIsMenuOpen] = useState(false)
//     const localRef = useRef<any>(null)
//     // Optional forwarding ref from parent, else use local ref.
//     const triggerRef = (ref || localRef) as typeof localRef

//     const closeMenu = () => {
//       triggerRef.current!.close()
//     }

//     const openMenu = () => {
//       triggerRef.current!.open()
//     }

//     const menuRef = useCallback((node: any) => {
//       setIsMenuOpen(!!node)
//     }, [])

//     const menu = <Popover ref={menuRef}>{children}</Popover>

//     // const editor = useSlate()

//     return (
//       <SubMenuContext.Provider
//         value={{
//           closeMenu,
//           openMenu
//         }}>
//         <Whisper placement="top" speaker={menu} ref={triggerRef} trigger="none">
//           <ToolbarButton
//             // active={isMenuOpen || (format ? WepublishEditor.isFormatActive(editor, format) : false)}
//             onMouseDown={e => {
//               e.preventDefault()
//               isMenuOpen ? closeMenu() : openMenu()
//             }}>
//             <Icon
//               style={{
//                 minWidth: '15px' // width of close icon (14px) so that element does not change size as long as the provided icon is < 15px.
//               }}
//               icon={isMenuOpen ? 'close' : icon}
//             />
//           </ToolbarButton>
//         </Whisper>
//       </SubMenuContext.Provider>
//     )
//   }
// )

export const SubMenuButton = (props: any) => {
  const {children} = props
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleClick = () => {
    if (!isMenuOpen) {
      // attach/remove event handler
      document.addEventListener('click', this.handleOutsideClick, false)
    } else {
      document.removeEventListener('click', this.handleOutsideClick, false)
    }
    setIsMenuOpen(!isMenuOpen)
  }

  const handleOutsideClick = (e: any) => {
    // ignore clicks on the component itself
    if (this.node.contains(e.target)) {
      return
    }

    this.handleClick()
  }

  return (
    <>
      <div onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <ToolbarElement type="" icon={props.icon}>
          <Emoji />
        </ToolbarElement>
      </div>
      {isMenuOpen && children}
    </>
  )
}

export const ToolbarEmoji = () => {
  const editor = useStoreEditor()

  return (
    <SubMenuButton icon={<Emoji />}>
      <Popover isOpen Icon={Emoji}>
        <EmojiPicker setEmoji={emoji => editor?.insertText(emoji)} />
      </Popover>
    </SubMenuButton>
  )
}

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
      {/* <ToolbarMark
        type={useSlatePluginType(MARK_SUPERSCRIPT)}
        clear={useSlatePluginType(MARK_SUBSCRIPT)}
        icon={<Superscript />}
      />
      <ToolbarMark
        type={useSlatePluginType(MARK_SUBSCRIPT)}
        clear={useSlatePluginType(MARK_SUPERSCRIPT)}
        icon={<Subscript />}
      /> */}
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
