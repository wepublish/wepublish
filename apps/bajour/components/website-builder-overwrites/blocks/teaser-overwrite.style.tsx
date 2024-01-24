import {Button, styled} from '@mui/material'
import {Image, TeaserContent, TeaserLead, TeaserPreTitle, TeaserTitle} from '@wepublish/website'
import {NextWepublishLink} from '../../should-be-website-builder/next-wepublish-link'

export const fluidTypography = (minSize: number, maxSize: number): string => {
  const minViewPort = 390
  const maxViewPort = 3840

  return `clamp(
    ${minSize}px,
    calc(
      ${minSize}px + (${maxSize} - ${minSize}) * (
        (100vw + ${minViewPort}px) / (${maxViewPort} - ${minViewPort})
      )
    ),
    ${maxSize}px
  )`
}

export const LinkAndGridContainer = styled(NextWepublishLink)`
  grid-column: -1/1;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(12, 1fr);
  }
`

export const TeaserImgStyled = styled(Image)`
  width: 100%;
  object-fit: cover;
  grid-column: -1/1;
  aspect-ratio: 3/2;
`

export const TeaserContentStyled = styled(TeaserContent)``

export const TeaserPreTitleStyled = styled(TeaserPreTitle)``

export const TeaserTitlesStyled = styled(TeaserTitle)`
  margin: 0;
`

export const TitleLine = styled('hr')`
  background-color: #ffbaba;
  height: 2px;
  width: 100%;
  margin: 0;
  border: 0;

  ${({theme}) => theme.breakpoints.up('sm')} {
    height: 3px;
  }
`

export const AuthorsAndDate = styled('p')`
  margin: 0;
`

export const TeaserLeadStyled = styled('div')``

export const SingleLine = styled('hr')`
  background-color: #ffdddd;
  border: 0;
  margin: 0;
`

export const TextLine = styled('hr')`
  background-color: #ffdddd;
  border: 0;
  margin: 0;
`

export const TeaserLeadBelow = styled(TeaserLead)`
  margin: 0;
  grid-column: -1/1;

  ${({theme}) => theme.breakpoints.up('sm')} {
    display: none;
  }
`

export const ReadMoreButton = styled(Button)`
  justify-self: end;
`
