import {styled} from '@mui/material'
import {BlockFormat} from '@wepublish/richtext/website'
import {BuilderRichTextBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, RichTextBlock as RichTextBlockType} from '@wepublish/website/api'
import {useMemo} from 'react'
import {createEditor} from 'slate'
import {Editable, Slate, withReact} from 'slate-react'

export const isRichTextBlock = (block: Block): block is RichTextBlockType =>
  block.__typename === 'RichTextBlock'

const RichTextBlockWrapper = styled('div')``

export const RichTextBlock = ({className, richText}: BuilderRichTextBlockProps) => {
  const defaultValue = [{type: BlockFormat.Paragraph, children: [{text: ''}]}]
  const editor = useMemo(() => withReact(createEditor()), [])
  const {
    richtext: {RenderLeaf, RenderElement}
  } = useWebsiteBuilder()

  return (
    <RichTextBlockWrapper className={className}>
      <Slate
        editor={editor}
        value={richText ?? defaultValue}
        onChange={newValue => {
          // readonly
        }}>
        <Editable readOnly renderElement={RenderElement as any} renderLeaf={RenderLeaf as any} />
      </Slate>
    </RichTextBlockWrapper>
  )
}
