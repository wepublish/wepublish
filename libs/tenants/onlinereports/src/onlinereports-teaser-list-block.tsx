import styled from '@emotion/styled';
import { css } from '@mui/material';
import { TeaserListBlock } from '@wepublish/block-content/website';
import {
  BuilderTeaserListBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const ORTeaserListBlockWrapper = styled('div')`
  //grid-column: span 3;
`;

export const OnlineReportsTeaserListBlock = (
  props: BuilderTeaserListBlockProps
) => {
  const {
    elements: { H5 },
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const teaserListCss = css``;

  return (
    <TeaserListBlock
      {...props}
      css={teaserListCss}
    />
  );
};
