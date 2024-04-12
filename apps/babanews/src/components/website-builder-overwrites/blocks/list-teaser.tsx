import {styled} from '@mui/material'
import {
  Image,
  PreTitle,
  Teaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
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

export const ListTeaser = styled(Teaser)`
  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-areas:
      'image pretitle'
      'image title'
      'image lead'
      'image authors'
      'image .';
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(5, auto);
    column-gap: ${({theme}) => theme.spacing(4)};

    ${TeaserPreTitleNoContent} {
      width: 20%;
      height: 5px;
    }

    ${TeaserPreTitleWrapper} {
      width: max-content;
      height: auto;
      margin-bottom: ${({theme}) => theme.spacing(0.5)};
    }

    ${PreTitle} {
      transform: none;
    }

    ${TeaserImageWrapper} {
      aspect-ratio: 16/9;
      width: 90%;
    }
  }
`
