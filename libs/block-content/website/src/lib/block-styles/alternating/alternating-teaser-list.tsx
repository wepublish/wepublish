import { css } from '@emotion/react';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { TeaserWrapper } from '../../teaser/base-teaser';

export const AlternatingTeaserListBlock = (
  props: BuilderBlockStyleProps['AlternatingTeaserList']
) => {
  const {
    blocks: { TeaserList },
  } = useWebsiteBuilder();

  return (
    <TeaserList
      {...props}
      css={css`
        ${TeaserWrapper} {
          grid-column: -1/1;
          grid-row: unset;
        }
      `}
    />
  );
};
