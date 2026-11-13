import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  joinAuthorNames,
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderImageProps,
  BuilderTeaserSlotsBlockProps,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useId } from 'react';

import { designText } from '../../theme';
import { BlockHeader, splitButtonTeaser } from '../block-header';
import { WepBlockStyles } from '../block-styles/wep-block-styles';

export const isLatestNews = ({
  blockStyle,
}: Pick<BuilderTeaserSlotsBlockProps, 'blockStyle'>) =>
  hasBlockStyle(WepBlockStyles.LatestNews)({ blockStyle });

export const LatestNewsWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    gap: 60px;
  }
`;

export const LatestNewsArticles = styled('div')`
  display: grid;
  // The columns never wider than the screen, even while an image is missing
  grid-template-columns: minmax(0, 1fr);
  gap: 50px 35px;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const LatestNewsArticle = styled('article')`
  a,
  a:hover {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 30px;
    color: inherit;
    text-decoration: none;
  }
`;

export const LatestNewsImage = styled(Image)`
  width: 100%;
  aspect-ratio: 400 / 270;
  object-fit: cover;
`;

export const LatestNewsText = styled('div')`
  display: grid;
  gap: 15px;
`;

export const LatestNewsArticleTitle = styled('h3')`
  ${designText.h4 as CSSObject}
  margin: 0;
  hyphens: manual;
`;

export const LatestNewsMeta = styled('p')`
  ${designText.textSmallMono as CSSObject}
  margin: 0;
  color: #888888;
  hyphens: manual;
`;

/** An article as card: the image, the title and "<authors>, <date>" below */
export const NewsCard = ({
  className,
  href,
  target,
  image,
  title,
  authors,
  date,
}: {
  className?: string;
  href?: string | null;
  target?: string | null;
  image?: BuilderImageProps['image'] | null;
  title?: string | null;
  authors?: string[] | null;
  date?: string | null;
}) => {
  const {
    date: { format },
  } = useWebsiteBuilder();
  const titleId = useId();

  const meta = [
    joinAuthorNames(authors ?? [], ', ', ', '),
    date && format(new Date(date), false),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <LatestNewsArticle
      className={className}
      aria-labelledby={titleId}
    >
      <Link
        href={href ?? undefined}
        target={target ?? undefined}
      >
        {image && <LatestNewsImage image={image} />}

        <LatestNewsText>
          <LatestNewsArticleTitle id={titleId}>{title}</LatestNewsArticleTitle>
          {meta && <LatestNewsMeta>{meta}</LatestNewsMeta>}
        </LatestNewsText>
      </Link>
    </LatestNewsArticle>
  );
};

const LatestNewsTeaser = ({ teaser }: { teaser: FullTeaserFragment }) => (
  <NewsCard
    href={selectTeaserUrl(teaser)}
    target={selectTeaserTarget(teaser)}
    image={selectTeaserImage(teaser)}
    title={selectTeaserTitle(teaser)}
    authors={selectTeaserAuthors(teaser)}
    date={selectTeaserDate(teaser)}
  />
);

/**
 * The latest articles below the title of the block. A custom teaser without
 * image is the button next to the title (e.g. "Alle anzeigen"), with its
 * pre-title as label.
 */
export const LatestNews = ({
  className,
  title,
  teasers,
}: BuilderTeaserSlotsBlockProps) => {
  const { entries: articles, button } = splitButtonTeaser(teasers);

  return (
    <LatestNewsWrapper className={className}>
      <BlockHeader
        title={title}
        button={button}
      />

      <LatestNewsArticles>
        {articles.map((teaser, index) => (
          <LatestNewsTeaser
            key={index}
            teaser={teaser}
          />
        ))}
      </LatestNewsArticles>
    </LatestNewsWrapper>
  );
};
