import styled from '@emotion/styled'
import {BlockFormat} from '@wepublish/richtext'
import {BuilderRichTextBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {BlockContent, RichTextBlock as RichTextBlockType} from '@wepublish/website/api'
import {useMemo} from 'react'
import {createEditor} from 'slate'
import {Editable, Slate, withReact} from 'slate-react'

export const isRichTextBlock = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType => block.__typename === 'RichTextBlock'

export const RichTextBlockWrapper = styled('div')``

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
        initialValue={richText ?? defaultValue}
        onChange={newValue => {
          // readonly
        }}>
        <Editable readOnly renderElement={RenderElement as any} renderLeaf={RenderLeaf as any} />
      </Slate>
    </RichTextBlockWrapper>
  )
}
