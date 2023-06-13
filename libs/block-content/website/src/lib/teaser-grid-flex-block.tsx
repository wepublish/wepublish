import {css, styled} from '@mui/material'
import {Block, TeaserGridFlexBlock as TeaserGridFlexBlockType} from '@wepublish/website/api'
import {BuilderTeaserGridFlexBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isTeaserGridFlexBlock = (block: Block): block is TeaserGridFlexBlockType =>
  block.__typename === 'TeaserGridFlexBlock'

export const TeaserGridFlexBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({theme}) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`

export const TeaserGridFlexBlock = ({
  flexTeasers,
  showLead,
  className
}: BuilderTeaserGridFlexBlockProps) => {
  const {
    blocks: {Teaser}
  } = useWebsiteBuilder()

  return (
    <TeaserGridFlexBlockWrapper className={className}>
      {flexTeasers?.map((teaser, index) => (
        <Teaser key={index} showLead={showLead} {...teaser} />
      ))}
    </TeaserGridFlexBlockWrapper>
  )
}
