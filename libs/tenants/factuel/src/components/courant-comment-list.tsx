import styled from '@emotion/styled';
import {
  CommentList,
  CommentListReadMore,
  CommentListWrapper,
} from '@wepublish/comments/website';
import { BuilderCommentListProps } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

import { courantTokens } from '../brand-tokens';

const { pageGap, pageMaxWidth } = courantTokens.layout;
const { medium: mediumButtonPadding } = courantTokens.button.padding;

const CourantCommentListWrapper = styled('section')`
  display: grid;
  row-gap: ${({ theme }) => theme.spacing(pageGap.xs)};
  width: 100%;
  max-width: ${pageMaxWidth}px;
  margin-inline: auto;

  ${CommentListWrapper} {
    gap: ${({ theme }) => theme.spacing(4)};
  }

  /* Use Courant's button style */
  ${CommentListReadMore} {
    padding: ${({ theme }) =>
      `${theme.spacing(mediumButtonPadding.y)} ${theme.spacing(mediumButtonPadding.x)}`};
    text-transform: none;
  }
`;

const CourantCommentListHeading = styled('h2')`
  margin: 0;
  font-family: var(--courant-display);
  font-size: ${courantTokens.typography.headings.page.h4};
  font-weight: 500;
  letter-spacing: -0.0075em;
  line-height: 1;
`;

export const CourantCommentList = (props: BuilderCommentListProps) => {
  const { t } = useTranslation();

  return (
    <CourantCommentListWrapper className={props.className}>
      <CourantCommentListHeading>
        {t('article.comments')}
      </CourantCommentListHeading>

      <CommentList
        {...props}
        className={undefined}
      />
    </CourantCommentListWrapper>
  );
};
