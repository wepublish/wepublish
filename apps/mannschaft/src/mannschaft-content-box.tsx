import {styled} from '@mui/material'
import {
  BuilderEmbedBlockProps,
  BuilderImageBlockProps,
  BuilderRichTextBlockProps
} from '@wepublish/website'
import {useWebsiteBuilder} from '@wepublish/website'
import {ApiV1} from '@wepublish/website'
import {allPass, anyPass} from 'ramda'
import {hasBlockStyle} from '@wepublish/website'
import {isImageBlock} from '@wepublish/website'
import {isRichTextBlock} from '@wepublish/website'
import {isEmbedBlock} from '@wepublish/website'

export const MannschaftContentBox = (
  props: BuilderImageBlockProps | BuilderRichTextBlockProps | BuilderEmbedBlockProps
) => {
  const {
    blocks: {Image, RichText, Embed}
  } = useWebsiteBuilder()

  if (props.__typename === 'ImageBlock') {
    return (
      <MannschaftContentBoxWrapper>
        <Image {...props} />
      </MannschaftContentBoxWrapper>
    )
  }
  if (props.__typename === 'RichTextBlock') {
    return (
      <MannschaftContentBoxWrapper>
        <RichText {...props} />
      </MannschaftContentBoxWrapper>
    )
  }
  if (props.__typename === 'EmbedBlock') {
    return (
      <MannschaftContentBoxWrapper>
        <Embed {...props} />
      </MannschaftContentBoxWrapper>
    )
  }
}

export const isContentBoxBlock = (
  block: ApiV1.Block
): block is ApiV1.ImageBlock | ApiV1.RichTextBlock | ApiV1.EmbedBlock =>
  allPass([anyPass([isImageBlock, isRichTextBlock, isEmbedBlock]), hasBlockStyle('ContentBox')])(
    block
  )

const MannschaftContentBoxWrapper = styled('div')`
  padding: ${({theme}) => theme.spacing(3)};
  background-color: lightyellow;

  & + & {
    margin-top: -${({theme}) => theme.spacing(9)};
  }
`
