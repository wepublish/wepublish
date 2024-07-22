import {styled} from '@mui/material'
import {
  ImageWrapper,
  Teaser,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '@wepublish/website'

export const HighlightTeaser = styled(Teaser)`
  background-color: #000;
  color: #fff;
  grid-template-areas:
    'image image image'
    '. pretitle .'
    '. title .'
    '. lead .'
    '. . .';
  grid-auto-rows: auto;
  grid-template-columns: 0 1fr 0;

  gap: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-areas:
      'image . .'
      'image pretitle .'
      'image title .'
      'image lead .'
      'image . .';
    grid-template-columns: 2fr 1fr 0;
    column-gap: ${({theme}) => theme.spacing(4)};
  }

  ${TeaserPreTitleWrapper} {
    margin-bottom: 0;
    height: unset;
    color: #000;
    width: max-content;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    transform: unset;
  }

  ${TeaserLead} {
    &.MuiTypography-gutterBottom,
    & {
      margin-bottom: 0;
    }
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${ImageWrapper} {
    ${({theme}) => theme.breakpoints.up('md')} {
      aspect-ratio: 5/3;
      max-height: unset;
    }
  }
`
