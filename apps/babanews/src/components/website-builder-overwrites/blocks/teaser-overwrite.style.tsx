import {Button, styled} from '@mui/material'
import {NextWepublishLink} from '@wepublish/utils/website'
import {Image, TeaserContent, TeaserLead, TeaserPreTitle, TeaserTitle} from '@wepublish/website'

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
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto;
  align-items: center;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(12, 1fr);
  }
`

export const TeaserImgStyled = styled(Image)`
  width: 100%;
  object-fit: cover;
  grid-column: 1/7;
  aspect-ratio: 3/2;
`

export const TeaserContentStyled = styled(TeaserContent)`
  grid-column: 7/13;
`

export const TeaserPreTitleNoContent = styled(TeaserPreTitle)`
  background-color: ${({theme}) => theme.palette.common.black};
  height: 3px;
  width: 100%;
  margin-bottom: ${({theme}) => theme.spacing(1.5)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    height: 5px;
    width: 20%;
  }
`

export const TeaserPreTitleStyled = styled(TeaserPreTitle)`
  margin-bottom: ${({theme}) => `-${theme.spacing(3)}`};
  border-top: 3px solid ${({theme}) => theme.palette.secondary.main};

  ${({theme}) => theme.breakpoints.up('sm')} {
    border: none;
    margin-bottom: ${({theme}) => theme.spacing(1.5)};
  }
`

export const PreTitleStyled = styled('span')`
  padding: ${({theme}) => `${theme.spacing(0.5)} ${theme.spacing(1.5)}`};
  background-color: ${({theme}) => theme.palette.secondary.main};
  display: inline-block;
  font-size: 22px;
  transform: translateY(-100%);

  ${({theme}) => theme.breakpoints.up('sm')} {
    transform: none;
  }
`

export const TeaserTitlesStyled = styled(TeaserTitle)`
  margin: 0;
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
