import {css, Theme, useTheme} from '@mui/material'
import {styled} from '@mui/material'
import {BuilderBreakBlockProps, useWebsiteBuilder} from '@wepublish/website'
import {useMemo} from 'react'

const Banner = styled('div')`
  aspect-ratio: 2.7/1;
  width: 100%;
  background-color: ${({theme}) => theme.palette.info.main};
`

const imageStyles = (theme: Theme) => css`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

export const FullWidthBanner = ({richText, text, image}: BuilderBreakBlockProps) => {
  const theme = useTheme()
  const styles = useMemo(() => imageStyles(theme), [theme])
  const {
    elements: {Image}
  } = useWebsiteBuilder()
  return <Banner>{image && <Image image={image} css={styles} />}</Banner>
}
