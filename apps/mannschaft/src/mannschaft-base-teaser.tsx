import styled from '@emotion/styled';
import {
  BaseTeaser,
  TeaserMetadata,
  TeaserTags,
} from '@wepublish/block-content/website';

export const MannschaftBaseTeaser = styled(BaseTeaser)`
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
`;
