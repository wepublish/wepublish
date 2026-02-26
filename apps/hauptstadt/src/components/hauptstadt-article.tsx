import styled from '@emotion/styled';
import { css, NoSsr, Typography } from '@mui/material';
import { Article, ArticleInfoWrapper } from '@wepublish/article/website';
import {
  ImageBlockWrapper,
  TeaserGridBlockWrapper,
  TeaserGridFlexBlockWrapper,
  TeaserListBlockWrapper,
  TeaserSlotsBlockWrapper,
  TitleBlockLead,
  TitleBlockWrapper,
} from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import {
  Article as ArticleType,
  useCommentListQuery,
} from '@wepublish/website/api';
import { BuilderArticleProps, Button } from '@wepublish/website/builder';
import {
  BuilderArticleAuthorsProps,
  BuilderArticleMetaProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Fragment, memo, useState } from 'react';
import { FaCommentSlash, FaRegComment, FaShare } from 'react-icons/fa6';
import { MdFormatSize, MdPrint } from 'react-icons/md';

import { contentTheme } from '../theme';
import { breakoutContainerOnXs } from '../utils/breakout-container';
import { FontSizePicker } from './font-size-picker';
import { CurrentPaywallContext } from './hauptstadt-paywall';

const ArticleWithPaywall = memo<BuilderArticleProps>(
  function WithPaywall(props) {
    return (
      <CurrentPaywallContext.Provider value={props.data?.article.paywall}>
        <Article {...props} />
      </CurrentPaywallContext.Provider>
    );
  }
);

export const HauptstadtArticle = createWithTheme(
  styled(ArticleWithPaywall)`
    row-gap: ${({ theme }) => theme.spacing(3.5)};

    > ${ImageBlockWrapper}:first-of-type img {
      // only breakout the image so that the caption is still aligned
      ${breakoutContainerOnXs}
    }

    > ${TitleBlockWrapper}:first-of-type {
      grid-row-start: 2;
    }

    ${ArticleInfoWrapper} {
      grid-row-start: 3;
      gap: ${({ theme }) => theme.spacing(1)};
    }

    ${TeaserListBlockWrapper},
    ${TeaserGridBlockWrapper},
    ${TeaserSlotsBlockWrapper},
    ${TeaserGridFlexBlockWrapper} {
      padding-top: var(--article-content-row-gap);
      border-top: 1px solid ${({ theme }) => theme.palette.primary.main};
    }

    ${({ data }) =>
      data?.article.latest.properties.find(
        prop => prop.key === 'type' && prop.value === 'opinion'
      ) &&
      css`
        ${TitleBlockLead} {
          font-style: italic;
        }
      `}
  `,
  contentTheme
);

const HauptstadtArticleAuthorsWrapper = styled('div')`
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.primary.main};
`;

export const HauptstadtArticleAuthors = ({
  article,
  className,
}: BuilderArticleAuthorsProps) => {
  const { AuthorChip, ArticleDate } = useWebsiteBuilder();
  const authors =
    article?.latest.authors.filter(author => !author.hideOnArticle) || [];

  if (!authors.length) {
    return;
  }

  return (
    <Typography
      variant="articleAuthors"
      component={HauptstadtArticleAuthorsWrapper}
      className={className}
    >
      {authors.length && (
        <>
          Von{' '}
          {authors.map((author, index) => (
            <Fragment key={author.id}>
              <AuthorChip author={author} />
              {index !== authors.length - 1 ? ' und ' : ', '}
            </Fragment>
          ))}
        </>
      )}

      <ArticleDate article={article as ArticleType} />
    </Typography>
  );
};

export const HauptstadtArticleMetaWrapper = styled('div')`
  display: flex;
  flex-flow: row wrap;

  .MuiButton-startIcon {
    margin-right: ${({ theme }) => theme.spacing(0.5)};
  }
`;

const MetaWrapperButton = styled(Button)`
  padding-top: 0;
  color: ${({ theme }) => theme.palette.common.black};
`;

const MetaWrapperTypography = styled(Typography)`
  text-decoration: underline;
`;

export const HauptstadtArticleMeta = ({
  article,
  className,
}: BuilderArticleMetaProps) => {
  const [openFontSizeModal, setOpenFontSizeModal] = useState(false);
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const { data } = useCommentListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      itemId: article.id,
    },
  });

  const commentCount = data?.commentsForItem.length;
  const canShare = typeof window !== 'undefined' && 'share' in navigator;

  return (
    <>
      <HauptstadtArticleMetaWrapper className={className}>
        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          LinkComponent={Link}
          href="#comments"
          startIcon={
            article.disableComments ?
              <FaCommentSlash size={16} />
            : <FaRegComment size={16} />
          }
        >
          <MetaWrapperTypography variant="caption">
            {!commentCount ?
              'Keine Beiträge'
            : `${commentCount} ${commentCount === 1 ? 'Beitrag' : 'Beiträge'}`}
          </MetaWrapperTypography>
        </MetaWrapperButton>

        {canShare && (
          <NoSsr>
            <MetaWrapperButton
              color="primary"
              variant="text"
              size="medium"
              startIcon={<FaShare size={16} />}
              onClick={async () => {
                navigator.share({
                  url: window.location.href,
                  title: article.latest.title ?? undefined,
                  text: article.latest.lead ?? undefined,
                });
              }}
            >
              <MetaWrapperTypography variant="caption">
                Teilen
              </MetaWrapperTypography>
            </MetaWrapperButton>
          </NoSsr>
        )}

        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          startIcon={<MdPrint size={16} />}
          onClick={() => print()}
        >
          <MetaWrapperTypography variant="caption">
            Drucken
          </MetaWrapperTypography>
        </MetaWrapperButton>

        <MetaWrapperButton
          color="primary"
          variant="text"
          size="medium"
          startIcon={<MdFormatSize size={16} />}
          onClick={() => setOpenFontSizeModal(true)}
        >
          <MetaWrapperTypography variant="caption">
            Schrift
          </MetaWrapperTypography>
        </MetaWrapperButton>
      </HauptstadtArticleMetaWrapper>

      <FontSizePicker
        open={openFontSizeModal}
        onCancel={() => setOpenFontSizeModal(false)}
        onSubmit={() => setOpenFontSizeModal(false)}
      />
    </>
  );
};
