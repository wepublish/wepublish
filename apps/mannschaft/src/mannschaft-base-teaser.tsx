import {styled} from '@mui/material'
import {Teaser, TeaserMetadata, TeaserTags} from '@wepublish/website'

export const MannschaftBaseTeaser = styled(Teaser)`
  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'tags';

  ${TeaserTags} {
    display: flex;
  }

  ${TeaserMetadata} {
    display: none;
  }

  .MuiChip-root {
    color: inherit;
    border-color: inherit;
  }
`
