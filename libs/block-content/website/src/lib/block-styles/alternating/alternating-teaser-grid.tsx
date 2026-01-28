import { css } from '@emotion/react';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { TeaserWrapper } from '../../teaser/base-teaser';

export const AlternatingTeaserGridBlock = (
  props: BuilderBlockStyleProps['AlternatingTeaserGrid']
) => {
  const {
    blocks: { TeaserGrid },
  } = useWebsiteBuilder();

  return (
    <TeaserGrid
      {...props}
      numColumns={1}
      css={css`
        ${TeaserWrapper} {
          grid-column: -1/1;
          grid-row: unset;
        }
      `}
    />
  );
};
