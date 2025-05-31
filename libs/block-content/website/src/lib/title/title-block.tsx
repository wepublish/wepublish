import styled from '@emotion/styled'
import {BlockContent, TitleBlock as TitleBlockType} from '@wepublish/website/api'
import {BuilderTitleBlockProps} from '@wepublish/website/builder'
import {H3} from '@wepublish/ui'
import {Typography} from '@mui/material'

export const isTitleBlock = (block: Pick<BlockContent, '__typename'>): block is TitleBlockType =>
  block.__typename === 'TitleBlock'

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-auto-rows: min-content;
`
export const TitleBlockTitle = styled(H3)``

export const TitleBlock = ({title, lead, className}: BuilderTitleBlockProps) => {
  return (
    <TitleBlockWrapper className={className}>
      <TitleBlockTitle component="h1">{title}</TitleBlockTitle>
      {lead && (
        <Typography variant="subtitle1" component="p">
          {lead}
        </Typography>
      )}
    </TitleBlockWrapper>
  )
}
