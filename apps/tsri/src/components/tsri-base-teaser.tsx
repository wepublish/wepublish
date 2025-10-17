import styled from '@emotion/styled';
import { Chip, css, SxProps, Typography } from '@mui/material';
import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPeerImage,
  selectTeaserPreTitle,
  selectTeaserTags,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {} from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  Image,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { cond, T } from 'ramda';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { isDailyBriefingTeaser } from './daily-briefing/daily-briefing-teaser';

/*
export const TeaserWrapper = styled('article')<FlexAlignment>`
  display: grid;

  ${({ theme, w }) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;

      ${theme.breakpoints.up('md')} {
        ${TeaserTitle} {
          font-size: ${theme.typography.h3.fontSize};
          line-height: ${theme.typography.h3.lineHeight};
        }

        ${TeaserLead} {
          font-size: ${theme.typography.h6.fontSize};
          line-height: ${theme.typography.h6.lineHeight};
        }
      }
    `}

  ${({ theme, h, w, x, y }) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}
`;

export const TeaserImageWrapper = styled('div')`
  grid-column: 1/13;
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-area: image;
  position: relative;

  &:empty {
    min-height: ${({ theme }) => theme.spacing(4)};
  }
`;
export const TeaserImageInnerWrapper = styled('div')`
  position: relative;
`;

export const TeaserImage = styled(Image)`
  max-height: 400px;
  width: 100%;
  object-fit: cover;
  grid-column: 1/13;
  transition: transform 0.3s ease-in-out;
  aspect-ratio: 1.8;

  :where(${TeaserWrapper}:hover &) {
    transform: scale(1.1);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 1;
  }
`;

export const TeaserPeerLogo = styled(Image)`
  border-radius: 50%;
  position: absolute;
  bottom: ${({ theme }) => theme.spacing(2)};
  right: ${({ theme }) => theme.spacing(2)};
  width: 50px;
  height: 50px;
`;

export const TeaserContentWrapper = styled('div')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  grid-auto-rows: max-content;
  align-items: start;
  grid-template-areas:
    'image'
    'pretitle'
    'title'
    'lead'
    'authors';
`;

export const TeaserTitle = styled('h1')`
  grid-area: title;
`;

export const TeaserLead = styled('p')`
  font-weight: 300;
  grid-area: lead;
`;

export const TeaserAuthors = styled('span')`
  font-weight: 500;
`;

export const TeaserPreTitleNoContent = styled('div')`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({ theme }) => theme.palette.common.black};
  height: 3px;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(1.5)};

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const TeaserPreTitleWrapper = styled('div')`
  transition: background-color 0.3s ease-in-out;
  background-color: ${({ theme }) => theme.palette.accent.main};
  height: 3px;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(1.5)};
  grid-area: pretitle;

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

export const TeaserPreTitle = styled('div')`
  transition-property: color, background-color;
  transition-duration: 0.3s;
  transition-timing-function: ease-in-out;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({ theme }) => theme.palette.accent.main};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  width: fit-content;
  transform: translateY(-100%);

  :where(${TeaserWrapper}:hover &) {
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.primary.contrastText};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 18px;
  }
`;

export const TeaserMetadata = styled('div')`
  grid-area: authors;
`;

export const TeaserTime = styled('time')`
  font-weight: 400;
`;

export const TeaserTags = styled('div')`
  display: none;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-area: tags;
`;

*/

export const TeaserWrapper = styled('li')<FlexAlignment>`
  list-style: none;
  aspect-ratio: 16/9;
  overflow: hidden;
  background-color: transparent;
  cursor: pointer;
  border-radius: 1.55%;
  display: grid;

  ${({ theme, w }) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;

      ${theme.breakpoints.up('md')} {
        ${TeaserTitle} {
          font-size: ${theme.typography.h3.fontSize};
          line-height: ${theme.typography.h3.lineHeight};
        }

        ${TeaserLead} {
          font-size: ${theme.typography.h6.fontSize};
          line-height: ${theme.typography.h6.lineHeight};
        }
      }
    `}

  ${({ theme, h, w, x, y }) => css`
    ${theme.breakpoints.up('md')} {
      grid-column-start: ${x + 1};
      grid-column-end: ${x + 1 + w};
      grid-row-start: ${y + 1};
      grid-row-end: ${y + 1 + h};
    }
  `}

  &:hover {
    background-color: orange;
  }
`;

export const TeaserImageWrapper = styled('figure')`
  grid-row: 1 / 6;
  grid-column: 1/3;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: -1;
`;

export const TeaserImageInnerWrapper = styled('picture')``;

export const TeaserImage = styled(Image)``;

export const TeaserImageCaption = styled('figcaption')``;

export const TeaserPeerLogo = styled(Image)``;

export const TeaserContentWrapper = styled('article')`
  overflow: hidden;
  display: grid;
  grid-template-rows: 38.5% 5.75% 42.5% 7.5% 6.75%;
  grid-template-columns: 50% 50%;
  container: teaser/inline-size;
  gap: 0;
`;

export const TeaserTitle = styled('h1')`
  grid-row: 3;
  grid-column: 2 / 3;
  background-color: white;
  margin: 0 !important;
  padding: ${({ theme }) => `0 ${theme.spacing(0.5)}`};
  @container teaser (width > 200px) {
    font-size: calc((9 * 100cqw / 16) * 0.08) !important;
  }
`;

export const TeaserLead = styled('p')``;

export const TeaserAuthors = styled('span')``;

export const TeaserPreTitleNoContent = styled('div')``;

export const TeaserPreTitleWrapper = styled('div')`
  grid-row: 2;
  grid-column: 2 / 3;
  background-color: black;
`;

export const TeaserPreTitle = styled('div')`
  color: white;
  padding: ${({ theme }) => `0 ${theme.spacing(0.5)}`};
  @container teaser (width > 200px) {
    font-size: calc((9 * 100cqw / 16) * 0.045) !important;
    font-weight: bold;
    top: calc((9 * 100cqw / 16) * -0.012);
    position: relative;
  }
`;

export const TeaserMetadata = styled('div')`
  grid-row: 4;
  grid-column: 2 / 3;
  background-color: white;
  padding: ${({ theme }) => `0 ${theme.spacing(0.5)}`};
  margin: 0;
  @container teaser (width > 200px) {
    font-size: calc((9 * 100cqw / 16) * 0.04) !important;
    font-weight: bold;
  }
`;

export const TeaserTime = styled('time')``;

export const TeaserTags = styled('div')``;

const stretchToParentHeight = {
  display: 'grid',
  alignItems: 'stretch',
} satisfies SxProps;

const TeaserContent = ({
  href,
  className,
  children,
  target,
}: PropsWithChildren<{
  href?: string;
  className?: string;
  target?: string;
}>) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  /*
  if (href) {
    return (
      <Link
        color="inherit"
        underline="none"
        href={href}
        target={target}
        css={stretchToParentHeight}
      >
        <TeaserContentWrapper className={className}>
          {children}
        </TeaserContentWrapper>
      </Link>
    );
  }
*/

  return (
    <TeaserContentWrapper className={className}>
      {children}
    </TeaserContentWrapper>
  );
};

export const TsriTeaser = ({
  teaser,
  alignment,
  className,
  blockStyle,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const target = (teaser && selectTeaserTarget(teaser)) ?? undefined;
  const image = teaser && selectTeaserImage(teaser);
  const peerLogo = teaser && selectTeaserPeerImage(teaser);
  const publishDate = teaser && selectTeaserDate(teaser);
  const authors = teaser && selectTeaserAuthors(teaser);
  const tags =
    teaser && selectTeaserTags(teaser).filter(tag => tag.tag !== preTitle);

  const { t } = useTranslation();
  const {
    elements: { Link },
    date,
  } = useWebsiteBuilder();

  console.log('Teaser render', { teaser, alignment, className, blockStyle });

  return (
    true && (
      <TeaserWrapper {...alignment}>
        <TeaserContent
          href={href}
          target={target}
          className={className}
        >
          {/* pretitle start */}
          {preTitle && (
            <TeaserPreTitleWrapper>
              <Typography
                variant="teaserPretitle"
                component={TeaserPreTitle}
              >
                {preTitle}
              </Typography>
            </TeaserPreTitleWrapper>
          )}
          {!preTitle && <TeaserPreTitleNoContent />}
          {/* pretitle end */}

          {/* title start */}
          <Typography
            variant="teaserTitle"
            component={TeaserTitle}
          >
            {href ?
              <Link
                href={href}
                color="inherit"
                underline="none"
              >
                {title}
              </Link>
            : <>{title}</>}
          </Typography>
          {/* title end */}

          {/* lead start */}
          {lead && 1 < 0 && (
            <Typography
              variant="teaserLead"
              component={TeaserLead}
            >
              {lead}
            </Typography>
          )}
          {/* lead end */}

          {/* image start */}
          <TeaserImageWrapper>
            <TeaserImageInnerWrapper>
              {image && <TeaserImage image={image} />}
              {peerLogo && (
                <TeaserPeerLogo
                  image={peerLogo}
                  maxWidth={200}
                  square
                />
              )}
            </TeaserImageInnerWrapper>
            <TeaserImageCaption>{blockStyle}</TeaserImageCaption>
          </TeaserImageWrapper>
          {/* image end */}

          {/* meta start */}
          <Typography
            variant="teaserMeta"
            component={TeaserMetadata}
          >
            {authors && authors?.length ?
              <TeaserAuthors>
                {t('teaser.author.text', {
                  authors: authors?.join(t('teaser.author.seperator')),
                })}
              </TeaserAuthors>
            : null}

            {publishDate && authors && authors?.length ?
              `${t('teaser.meta.seperator')}`
            : null}

            {publishDate && (
              <TeaserTime
                suppressHydrationWarning
                dateTime={publishDate}
              >
                {date.format(new Date(publishDate), false)}
              </TeaserTime>
            )}
          </Typography>
          {/* meta end */}

          {/* tags start */}
          {!!tags?.length && (
            <TeaserTags>
              {tags?.slice(0, 5).map(tag => (
                <Chip
                  key={tag.id}
                  label={tag.tag}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </TeaserTags>
          )}
          {/* tags end */}
        </TeaserContent>
      </TeaserWrapper>
    )
  );
};

/*
export const TsriBaseTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <TsriTeaser {...props} />],
]);
*/

export const TsriBaseTeaser = cond([
  [isDailyBriefingTeaser, props => <></>],
  [T, props => <TsriTeaser {...props} />],
]);
