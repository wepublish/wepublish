import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  TitleBlockLead,
  TitleBlockPreTitle,
  TitleBlockPreTitleWrapper,
  TitleBlockTitle,
  TitleBlockWrapper,
} from '@wepublish/block-content/website';
import {
  BuilderTitleBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';
import { useIsArticleBody } from './courant-article-body.context';

const preTitleStyles = css`
  ${TitleBlockPreTitleWrapper} {
    font-family: var(--courant-kicker);
    font-size: ${courantTokens.typography.sizes.teaserPretitle};
    letter-spacing: 0.1em;
    line-height: 1;
    text-transform: uppercase;
    color: ${courantTokens.colors.warmGray[400]};
    background-color: transparent;
    padding: 0;
    margin: 0;
    width: auto;
  }
`;

const PageTitleBlockWrapper = styled(TitleBlockWrapper)`
  ${preTitleStyles}
`;

const ArticleTitleBlockWrapper = styled(TitleBlockWrapper)`
  gap: ${({ theme }) =>
    theme.spacing(courantTokens.layout.blockGaps.articleTitle)};
  ${preTitleStyles}
`;

export const CourantTitleBlock = ({
  title,
  preTitle,
  lead,
  className,
}: BuilderTitleBlockProps) => {
  const {
    elements: { H1 },
  } = useWebsiteBuilder();
  const inArticleBody = useIsArticleBody();
  const Wrapper =
    inArticleBody ? ArticleTitleBlockWrapper : PageTitleBlockWrapper;

  return (
    <Wrapper className={className}>
      <TitleBlockPreTitle preTitle={preTitle} />

      <H1 component={TitleBlockTitle}>{title}</H1>

      {lead && (
        <Typography
          variant="subtitle1"
          component={TitleBlockLead}
        >
          {lead}
        </Typography>
      )}
    </Wrapper>
  );
};
