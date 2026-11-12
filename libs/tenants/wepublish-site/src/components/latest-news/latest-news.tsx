import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isFilledTeaser,
  joinAuthorNames,
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  Button,
  Image,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useId } from 'react';

import { designText } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import { tertiaryButton } from '../button-styles';

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

export const LatestNewsHeader = styled('div')`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const LatestNewsTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
`;

export const LatestNewsButton = styled(Button)`
  ${({ theme }) => tertiaryButton(theme)}
`;

export const LatestNewsArticles = styled('div')`
  display: grid;
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

const LatestNewsTeaser = ({ teaser }: { teaser: FullTeaserFragment }) => {
  const {
    date: { format },
  } = useWebsiteBuilder();
  const titleId = useId();

  const image = selectTeaserImage(teaser);
  const authors = selectTeaserAuthors(teaser) ?? [];
  const date = selectTeaserDate(teaser);
  const meta = [
    joinAuthorNames(authors, ', ', ', '),
    date && format(new Date(date), false),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <LatestNewsArticle aria-labelledby={titleId}>
      <Link
        href={selectTeaserUrl(teaser) ?? undefined}
        target={selectTeaserTarget(teaser) ?? undefined}
      >
        {image && <LatestNewsImage image={image} />}

        <LatestNewsText>
          <LatestNewsArticleTitle id={titleId}>
            {selectTeaserTitle(teaser)}
          </LatestNewsArticleTitle>
          {meta && <LatestNewsMeta>{meta}</LatestNewsMeta>}
        </LatestNewsText>
      </Link>
    </LatestNewsArticle>
  );
};

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
  const filledTeasers = teasers.filter(isFilledTeaser);
  const isButton = (teaser: FullTeaserFragment) =>
    teaser.__typename === 'CustomTeaser' && !teaser.image;
  const articles = filledTeasers.filter(teaser => !isButton(teaser));
  const button = filledTeasers.find(isButton);
  const buttonLabel = button && selectTeaserPreTitle(button);
  const buttonUrl = button && selectTeaserUrl(button);

  return (
    <LatestNewsWrapper className={className}>
      {(title || buttonLabel) && (
        <LatestNewsHeader>
          {title && <LatestNewsTitle>{title}</LatestNewsTitle>}

          {buttonLabel && buttonUrl && (
            <LatestNewsButton
              variant="outlined"
              disableRipple
              LinkComponent={Link}
              href={buttonUrl}
              target={selectTeaserTarget(button) ?? undefined}
            >
              {buttonLabel}
            </LatestNewsButton>
          )}
        </LatestNewsHeader>
      )}

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
