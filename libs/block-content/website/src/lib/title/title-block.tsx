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

export const TitleBlockPreTitle = styled('div')`
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({theme}) => theme.palette.accent.main};
  color: ${({theme}) => theme.palette.accent.contrastText};
  width: fit-content;
  margin-bottom: -${({theme}) => theme.spacing(1.5)};
`
export const TitleBlockLead = styled('p')``

export const TitleBlock = ({title, lead, preTitle, className}: BuilderTitleBlockProps) => {
  const {
    elements: {H2}
  } = useWebsiteBuilder()

  return (
    <TitleBlockWrapper className={className}>
      {preTitle && (
        <Typography variant="blockTitlePreTitle" component={TitleBlockPreTitle}>
          {preTitle}
        </Typography>
      )}

      <H2 component={TitleBlockTitle}>{title}</H2>

      {lead && (
        <Typography variant="subtitle1" component={TitleBlockLead}>
          {lead}
        </Typography>
      )}
    </TitleBlockWrapper>
  )
}
