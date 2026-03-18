import styled from '@emotion/styled';
import { Box, CircularProgress, Collapse } from '@mui/material';
import {
  alignmentForTeaserBlock,
  Blocks,
  hasBlockStyle,
  isFilledTeaser,
  isTeaserListBlock,
  selectTeaserLead,
  selectTeaserTitle,
} from '@wepublish/block-content/website';
import {
  ArticleTeaser,
  BlockContent,
  TeaserListBlock,
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
import { useCallback, useState } from 'react';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

export const isNewsTeasers = (block: BlockContent): block is TeaserListBlock =>
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

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((articleId: string) => {
    setExpandedId(prev => (prev === articleId ? null : articleId));
  }, []);

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
                expandedId={expandedId}
                onToggle={handleToggle}
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

const NewsTeaserExpandIcon = styled(MdExpandMore)`
  min-width: 18px;
  font-size: 18px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const NewsTeaserCollapseIcon = styled(MdExpandLess)`
  min-width: 18px;
  font-size: 18px;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const ExpandedContent = styled('div')`
  padding: ${({ theme }) => theme.spacing(2, 0)};
`;

type NewsTeaserExtraProps = {
  expandedId: string | null;
  onToggle: (articleId: string) => void;
};

const NewsTeaserUnstyled = ({
  teaser,
  className,
  expandedId,
  onToggle,
}: BuilderTeaserProps & NewsTeaserExtraProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);

  const articleId =
    teaser?.__typename === 'ArticleTeaser' ?
      (teaser as ArticleTeaser).article?.id
    : undefined;

  const isExpanded = !!(articleId && expandedId === articleId);

  const [fetchArticle, { data, loading }] = useArticleLazyQuery();

  const handleClick = () => {
    if (!articleId) {
      return;
    }
    onToggle(articleId);
    if (!data && !loading) {
      fetchArticle({ variables: { id: articleId } });
    }
  };

  const articleBlocks = data?.article?.latest?.blocks?.filter(
    block => block.__typename !== 'TitleBlock'
  ) as BlockContent[] | undefined;

  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  return (
    <div className={className}>
      <NewsTeaserClickable
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <NewsTeaserPreTitle>{title}</NewsTeaserPreTitle>
        <NewsTeaserContent>
          <NewsTeaserTitle>
            <H4 gutterBottom>{lead}</H4>
          </NewsTeaserTitle>
          {isExpanded ?
            <NewsTeaserCollapseIcon />
          : <NewsTeaserExpandIcon />}
        </NewsTeaserContent>
      </NewsTeaserClickable>

      <Collapse in={isExpanded}>
        <ExpandedContent>
          {loading && <CircularProgress size={24} />}
          {articleBlocks && (
            <Blocks
              blocks={articleBlocks}
              type="Article"
            />
          )}
        </ExpandedContent>
      </Collapse>
    </div>
  );
};

const NewsTeaserClickable = styled('div')`
  cursor: pointer;
`;

const NewsTeaser = styled(NewsTeaserUnstyled)`
  color: ${({ theme }) => theme.palette.text.primary};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(0)}`};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;
