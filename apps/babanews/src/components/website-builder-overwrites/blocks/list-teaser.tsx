import {styled} from '@mui/material'
import {
  Image,
  ImageWrapperStyled,
  PreTitleStyled,
  Teaser,
  TeaserPreTitleNoContent,
  TeaserPreTitleStyled
} from '@wepublish/website'

export const TeaserImgStyled = styled(Image)`
  width: 100%;
  object-fit: cover;
  grid-column: 1/7;
  aspect-ratio: 3/2;

  ${({theme}) => theme.breakpoints.up('md')} {
    aspect-ratio: 16/9;
  }
`

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

export const ListTeaser = styled(Teaser)`
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-areas: 'image content';
    grid-template-columns: 1fr 1fr;
    column-gap: ${({theme}) => theme.spacing(4)};

    ${TeaserPreTitleNoContent} {
      width: 20%;
      height: 5px;
    }

    ${TeaserPreTitleStyled} {
      width: max-content;
      height: auto;
      margin-bottom: ${({theme}) => theme.spacing(0.5)};
    }

    ${PreTitleStyled} {
      transform: none;
    }

    ${ImageWrapperStyled} {
      aspect-ratio: 16/9;
      width: 90%;
    }
  }
`
