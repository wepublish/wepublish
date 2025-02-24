import {css} from '@mui/material'
import {styled} from '@mui/material'
import {BlockContent, BreakBlock} from '@wepublish/website/api'
import {useWebsiteBuilder, BuilderBlockStyleProps} from '@wepublish/website/builder'
import {isBreakBlock} from '../../break/break-block'
import {hasBlockStyle} from '../../blocks'
import {allPass} from 'ramda'

export const BannerWrapper = styled('a')`
  aspect-ratio: 2.7/1;
  width: 100%;
  background-color: ${({theme}) => theme.palette.info.main};
  text-decoration: none;
  color: inherit;
`

const imageStyles = css`
  width: 100%;
  object-fit: cover;
`

export const Banner = ({image, linkURL, linkTarget}: BuilderBlockStyleProps['Banner']) => {
  const {
    elements: {Image}
  } = useWebsiteBuilder()

  return (
    <BannerWrapper href={linkURL ?? ''} target={linkTarget ?? '_blank'}>
      {image && <Image image={image} css={imageStyles} />}
    </BannerWrapper>
  )
}

export const isBannerBlockStyle = (block: Pick<BlockContent, '__typename'>): block is BreakBlock =>
  allPass([hasBlockStyle('Banner'), isBreakBlock])(block)
