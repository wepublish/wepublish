import styled from '@emotion/styled'
import {BlockContent, TitleBlock as TitleBlockType} from '@wepublish/website/api'
import {BuilderTitleBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Typography} from '@mui/material'

export const isTitleBlock = (block: Pick<BlockContent, '__typename'>): block is TitleBlockType =>
  block.__typename === 'TitleBlock'

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-auto-rows: min-content;
`
export const TitleBlockTitle = styled('h1')``

export const TitleBlock = ({title, lead, className}: BuilderTitleBlockProps) => {
  const {
    elements: {H2}
  } = useWebsiteBuilder()

  return (
    <TitleBlockWrapper className={className}>
      <H2 component={TitleBlockTitle}>{title}</H2>

      {lead && (
        <Typography variant="subtitle1" component="p">
          {lead}
        </Typography>
      )}
    </TitleBlockWrapper>
  )
}
