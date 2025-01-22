import styled from '@emotion/styled'
import {
  BuilderEmbedBlockProps,
  BuilderImageBlockProps,
  BuilderRichTextBlockProps
} from '@wepublish/website'
import {useWebsiteBuilder} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'
import {hasBlockStyle} from '@wepublish/website'
import {isImageBlock} from '@wepublish/website'
import {isRichTextBlock} from '@wepublish/website'
import {isEmbedBlock} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'

export const MannschaftContentBox = (
  props: BuilderImageBlockProps | BuilderRichTextBlockProps | BuilderEmbedBlockProps
) => {
  const {
    blocks: {Image, RichText, Embed}
  } = useWebsiteBuilder()

  return (
    <MannschaftContentBoxWrapper>
      {isImageBlock(props) && <Image {...props} />}
      {isRichTextBlock(props) && <RichText {...props} />}
      {isEmbedBlock(props) && <Embed {...props} />}
    </MannschaftContentBoxWrapper>
  )
}

const MannschaftContentBoxWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(3)};
  background-color: ${({theme}) => theme.palette.grey['200']};

  & + & {
    margin-top: -${({theme}) => theme.spacing(9)};
  }
`

export const isContentBoxBlock = (
  block: ApiV1.Block
): block is ApiV1.ImageBlock | ApiV1.RichTextBlock | ApiV1.EmbedBlock =>
  allPass([anyPass([isImageBlock, isRichTextBlock, isEmbedBlock]), hasBlockStyle('ContentBox')])(
    block
  )
