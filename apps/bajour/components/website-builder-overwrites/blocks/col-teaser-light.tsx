import {styled} from '@mui/material'

import {TeaserOverwrite} from './teaser-overwrite'
import {
  AuthorsAndDate,
  fluidTypography,
  TeaserContentStyled,
  TeaserImgStyled,
  TeaserLeadBelow,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled
} from './teaser-overwrite.style'

export const ColTeaserLight = styled(TeaserOverwrite)`
  gap: ${({theme}) => theme.spacing(1.5)};

  ${TeaserContentStyled} {
    grid-column: 10/24;
  }

  ${TeaserImgStyled} {
    grid-column: 2/10;
  }

  ${TeaserPreTitleStyled} {
    color: #e77964;
    font-size: ${fluidTypography(13, 27)};
    font-weight: 500;
  }

  ${TeaserTitlesStyled} {
    font-size: ${fluidTypography(17, 36)};
  }

  ${AuthorsAndDate} {
    font-size: ${fluidTypography(12, 20)};
  }

  ${TeaserLeadBelow},
  ${TeaserLeadStyled} {
    font-size: ${fluidTypography(14, 24)};
  }

  ${TeaserLeadStyled} {
    display: none;
  }

  ${TeaserLeadBelow} {
    grid-column: 2/24;
  }

  ${({theme}) => theme.breakpoints.up('sm')} {
    ${TeaserImgStyled} {
      grid-column: 2/6;
    }

    ${TeaserContentStyled} {
      grid-column: 6/12;
    }

    ${TeaserLeadStyled} {
      display: block;
    }
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    gap: ${({theme}) => theme.spacing(3)};

    ${TeaserContentStyled} {
      grid-column: span 8;
    }

    ${TeaserImgStyled} {
      grid-column: span 4;
    }
  }
`
