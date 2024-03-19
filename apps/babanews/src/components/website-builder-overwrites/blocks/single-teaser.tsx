import {styled} from '@mui/material'

import {TeaserOverwrite} from './teaser-overwrite'
import {
  AuthorsAndDate,
  fluidTypography,
  SingleLine,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled
} from './teaser-overwrite.style'

export const SingleTeaser = styled(TeaserOverwrite)`
  column-gap: ${({theme}) => theme.spacing(3)};
  align-items: start;

  ${TeaserContentStyled} {
    background: white;
    grid-column: 1/13;
  }

  ${TeaserImgStyled} {
    grid-column: 1/13;
    aspect-ratio: 1.8/1;
  }

  ${TeaserPreTitleStyled} {
    font-size: ${fluidTypography(17, 22)};
  }

  ${TeaserTitlesStyled} {
    font-size: ${fluidTypography(23, 44)};
    font-weight: bold;
  }

  ${AuthorsAndDate} {
    font-size: ${fluidTypography(11, 22)};
    font-weight: 500;
  }

  ${TeaserLeadStyled} {
    margin-top: ${({theme}) => theme.spacing(1)};
    margin-bottom: ${({theme}) => theme.spacing(1)};
    font-weight: 300;
    font-size: ${fluidTypography(12, 32)};
    line-height: 1.3;
  }

  ${SingleLine} {
    height: ${({theme}) => theme.spacing(1.5)};
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    margin-left: -${({theme}) => theme.spacing(1)};
    margin-right: -${({theme}) => theme.spacing(1)};
  }

  ${({theme}) => theme.breakpoints.up('sm')} {
    row-gap: ${({theme}) => theme.spacing(2)};

    ${TeaserImgStyled} {
      grid-column: 1/7;
      aspect-ratio: 1.8/1;
    }

    ${TeaserContentStyled} {
      grid-column: 7/13;
      padding: ${({theme}) => `0 ${theme.spacing(1.5)} ${theme.spacing(1.5)}`};
    }

    ${SingleLine} {
      height: ${({theme}) => theme.spacing(2)};
      margin-left: -${({theme}) => theme.spacing(1.5)};
      margin-right: -${({theme}) => theme.spacing(1.5)};
    }
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    ${TeaserContentStyled} {
      grid-column: 7/13;
    }

    ${TeaserImgStyled} {
      aspect-ratio: 3/2;
    }
  }
`
