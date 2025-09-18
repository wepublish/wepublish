import { css } from '@emotion/react';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { TeaserWrapper } from '../../teaser/base-teaser';

export const AlternatingTeaserSlotsBlock = (
  props: BuilderBlockStyleProps['AlternatingTeaserSlots']
) => {
  const {
    blocks: { TeaserSlots },
  } = useWebsiteBuilder();

  return (
    <TeaserSlots
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
