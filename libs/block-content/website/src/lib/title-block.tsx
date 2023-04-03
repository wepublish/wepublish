import {styled} from '@mui/material'
import {Block, TitleBlock as TitleBlockType} from '@wepublish/website/api'
import {BuilderTitleBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isTitleBlock = (block: Block): block is TitleBlockType =>
  block.__typename === 'TitleBlock'

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};
`

export const TitleBlock = ({title, lead, className}: BuilderTitleBlockProps) => {
  const {
    elements: {H3, H6}
  } = useWebsiteBuilder()

  return (
    <TitleBlockWrapper className={className}>
      <H3 component="h1">{title}</H3>

      <H6 component="p">{lead}</H6>
    </TitleBlockWrapper>
  )
}
