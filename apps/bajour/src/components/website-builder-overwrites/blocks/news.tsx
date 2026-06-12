import styled from '@emotion/styled';
import { Box, CircularProgress, Collapse } from '@mui/material';
import {
  alignmentForTeaserBlock,
  Blocks,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  isTitleBlock,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserListBlockFragment,
  useArticleLazyQuery,
  useGetImagesByTagQuery,
} from '@wepublish/website/api';
import {
  BuilderTeaserListBlockProps,
  BuilderTeaserProps,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useCallback, useId, useMemo, useState } from 'react';
import { MdEast, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

export const isNewsTeasers = (
  block: Pick<BlockContent, '__typename'>
): block is FullTeaserListBlockFragment =>
  allPass([hasBlockStyle('News'), isTeaserListBlock])(block);

export const NewsBlock = ({
  title,
  teasers,
  blockStyle,
}: Pick<BuilderTeaserListBlockProps, 'title' | 'teasers' | 'blockStyle'>) => {
  const filledTeasers = teasers.filter(isFilledTeaser);
  const numColumns = 1;
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  const { data: imagesData } = useGetImagesByTagQuery({
    variables: { tag: 'news-filler' },
  });

  const firstImage = imagesData?.getImagesByTag?.[0];

  return (
    <>
      <NewsTeaserListWrapper>
        <OrangeBox>
          <TeaserList>
            <H2 gutterBottom>{title}</H2>
            {filledTeasers.map((teaser, index) => (
              <NewsTeaser
                key={index}
                index={index}
                teaser={teaser}
                numColumns={numColumns}
                alignment={alignmentForTeaserBlock(index, numColumns)}
                blockStyle={blockStyle}
              />
            ))}
          </TeaserList>
          <Link
            href={'/a/tag/Kurz-News'}
            style={{ textDecoration: 'none' }}
          >
            <b>weitere Kurz-News &rarr;</b>
          </Link>
        </OrangeBox>

        <Filler>
          {firstImage &&
            (firstImage.link ?
              <Link href={firstImage.link}>
                <Image image={firstImage} />
              </Link>
            : <Image image={firstImage} />)}
        </Filler>
      </NewsTeaserListWrapper>
    </>
  );
};

const TeaserList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const Filler = styled(Box)`
  display: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: block;
  }
`;

const OrangeBox = styled('div')`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.palette.secondary.contrastText};
  border-color: ${({ theme }) => theme.palette.primary.main};
  border-width: ${({ theme }) => theme.spacing(0.5)};
  border-style: solid;
  gap: ${({ theme }) => theme.spacing(1.5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(4.5)};
  }

  color: ${({ theme }) => theme.palette.text.secondary};

  > a {
    font-size: ${({ theme }) => theme.typography.h5.fontSize};
  }
`;

const NewsTeaserListWrapper = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(2.5)};

  ${OrangeBox} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 2;
    }
  }

  ${Filler} {
    grid-column: span 3;

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-column: span 1;
    }
  }
`;

const NewsTeaserPreTitle = styled('span')`
  font-weight: 500;
  font-size: 18px;
`;

const NewsTeaserContent = styled('div')`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const NewsTeaserTitle = styled('div')`
  flex-grow: 1;

  h4 {
    font-weight: 300;
    font-size: 18px;
  }
`;

const NewsTeaserIcon = styled(MdEast)`
  min-width: 18px;
  font-size: 18px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const NewsTeaserExpandIcon = styled(MdKeyboardArrowDown)`
  min-width: 24px;
  font-size: 24px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const NewsTeaserCollapseIcon = styled(MdKeyboardArrowUp)`
  min-width: 24px;
  font-size: 24px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const NewsTeaserButton = styled('button')`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: ${({ theme }) => theme.spacing(0.5)};
  }
`;

const NewsTeaserArticle = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2)} 0 ${theme.spacing(1)}`};
`;

const NewsTeaserLoading = styled('div')`
  display: flex;
  align-items: center;
  min-height: ${({ theme }) => theme.spacing(5)};
`;

const NewsTeaserError = styled('p')`
  margin: 0;
  color: ${({ theme }) => theme.palette.error.main};
`;

const NewsTeaserUnstyled = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const articleId =
    teaser?.__typename === 'ArticleTeaser' ? teaser.article?.id : undefined;
  const articleContentId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [fetchArticle, { called, data, loading, error }] =
    useArticleLazyQuery();

  const articleBlocks = useMemo(
    () => data?.article.latest.blocks.filter(block => !isTitleBlock(block)),
    [data?.article.latest.blocks]
  );

  const toggleArticle = useCallback(() => {
    setIsOpen(open => !open);

    if (articleId && !called && !isOpen) {
      fetchArticle({ variables: { id: articleId } });
    }
  }, [articleId, called, fetchArticle, isOpen]);

  const {
    elements: { H4, Link },
  } = useWebsiteBuilder();

  const teaserContent = (
    <>
      <NewsTeaserPreTitle>{title}</NewsTeaserPreTitle>
      <NewsTeaserContent>
        <NewsTeaserTitle>
          <H4 gutterBottom>{lead}</H4>
        </NewsTeaserTitle>
        {articleId ?
          isOpen ?
            <NewsTeaserCollapseIcon />
          : <NewsTeaserExpandIcon />
        : <NewsTeaserIcon />}
      </NewsTeaserContent>
    </>
  );

  if (!articleId) {
    return (
      <Link
        href={href}
        className={className}
      >
        {teaserContent}
      </Link>
    );
  }

  return (
    <div className={className}>
      <NewsTeaserButton
        type="button"
        aria-expanded={isOpen}
        aria-controls={articleContentId}
        onClick={toggleArticle}
      >
        {teaserContent}
      </NewsTeaserButton>

      <Collapse
        in={isOpen}
        timeout="auto"
        unmountOnExit
      >
        <NewsTeaserArticle id={articleContentId}>
          {loading && (
            <NewsTeaserLoading>
              <CircularProgress size={18} />
            </NewsTeaserLoading>
          )}

          {error && (
            <NewsTeaserError>
              Der Artikel konnte nicht geladen werden.
            </NewsTeaserError>
          )}

          {!loading && !error && !!articleBlocks?.length && (
            <Blocks
              blocks={articleBlocks}
              type="Article"
            />
          )}
        </NewsTeaserArticle>
      </Collapse>
    </div>
  );
};

const NewsTeaser = styled(NewsTeaserUnstyled)`
  color: ${({ theme }) => theme.palette.text.primary};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  text-decoration: none;
`;
