import {styled} from '@mui/material'
import {Block, TitleBlock as TitleBlockType} from '@wepublish/website/api'
import {BuilderTitleBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {H3} from '@wepublish/ui'

export const isTitleBlock = (block: Block): block is TitleBlockType =>
  block.__typename === 'TitleBlock'

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-auto-rows: min-content;
`
export const TitleBlockTitle = styled(H3)``

export const TitleBlock = ({title, lead, className}: BuilderTitleBlockProps) => {
  const {
    elements: {H6}
  } = useWebsiteBuilder()

  return (
    <TitleBlockWrapper className={className}>
      <TitleBlockTitle component="h1">{title}</TitleBlockTitle>
      {lead && <H6 component="p">{lead}</H6>}
    </TitleBlockWrapper>
  )
}
