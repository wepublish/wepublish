import styled from '@emotion/styled';
import { Chip, css, Typography } from '@mui/material';
import {
  //selectTeaserAuthors,
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
import {
  FlexAlignment,
  FullImageFragment,
  Teaser as TeaserType,
} from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  Image,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export const selectTeaserAuthors = (teaser: TeaserType) => {
  switch (teaser.__typename) {
    case 'PageTeaser': {
      return null;
    }

    case 'ArticleTeaser': {
      return teaser.article?.latest.authors.filter(
        author => !author.hideOnTeaser
      );
    }

    case 'EventTeaser':
    case 'CustomTeaser':
      return null;
  }
};

export const TeaserWrapper = styled('li')<FlexAlignment>`
  list-style: none;
  aspect-ratio: 16/9;
  overflow: hidden;
  background-color: transparent;
  cursor: pointer;
  container: teaser/inline-size;
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

export const TeaserImageWrapper = styled('figure')`
  grid-row: 1 / 6;
  grid-column: 1/3;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: -1;
`;

export const TeaserImageInnerWrapper = styled('picture')``;

export const TeaserImage = styled(Image)`
  max-height: unset;
`;

export const TeaserAuthorImageWrapper = styled('figure')`
  grid-row: 1 / 6;
  grid-column: 1/3;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: -1;
  display: none;
`;

export const TeaserAuthorImage = styled(Image)`
  max-height: unset;
`;

export const TeaserImageCaption = styled('figcaption')``;

export const TeaserPeerLogo = styled(Image)``;

export const TeaserPreTitle = styled('div')`
  color: white;
  background-color: black;
  @container teaser (width > 200px) {
    font-size: calc((9 * 100cqw / 16) * 0.045) !important;
    line-height: calc((9 * 100cqw / 16) * 0.045) !important;
    font-weight: bold;
    padding: 0.5cqw;
  }
`;

export const TeaserContentWrapper = styled('article')`
  overflow: hidden;
  display: grid;
  grid-template-rows: 38.5% 5.75% 42.5% 7.5% 6.75%;
  grid-template-columns: 50% 50%;
  gap: 0;
  border-radius: calc((9 * 100cqw / 16) * 0.03);

  &:hover {
    ${TeaserPreTitle} {
      background-color: #f5ff64;
      color: black;
    }
  }
`;

export const TeaserTitle = styled('h1')`
  grid-row: 3;
  grid-column: 2 / 3;
  background-color: white;
  margin: 0 !important;
  margin-bottom: 0 !important;
  @container teaser (width > 200px) {
    font-size: calc((9 * 100cqw / 16) * 0.08) !important;
    line-height: 1.05 !important;
    padding: 1.5cqw 1.5cqw 2.2cqw;
  }
`;

export const TeaserLead = styled('p')`
  display: none;
`;

export const TeaserAuthors = styled('span')``;

export const TeaserAuthorTextWrapper = styled('span')``;

export const TeaserAuthorWrapper = styled('span')``;

export const TeaserPreTitleNoContent = styled('div')``;

export const TeaserPreTitleWrapper = styled('div')`
  grid-row: 2;
  grid-column: 2 / 3;
  background-color: transparent;
`;

export const TeaserMetadata = styled('div')`
  grid-row: 4;
  grid-column: 2 / 3;
  background-color: white;
  margin: 0;
  font-size: calc((9 * 100cqw / 16) * 0.04) !important;
  font-weight: bold;
  padding: 0 0.5cqw;
`;

export const TeaserTime = styled('time')``;

export const TeaserTags = styled('div')`
  display: none;
`;

export const TeaserContent = ({
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

  return (
    true && (
      <TeaserWrapper
        {...alignment}
        className={className}
      >
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
          {lead && (
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
              {image && <TeaserImage image={image as FullImageFragment} />}
              {peerLogo && (
                <TeaserPeerLogo
                  image={peerLogo}
                  maxWidth={200}
                  square
                />
              )}
            </TeaserImageInnerWrapper>
            <TeaserImageCaption>
              {teaser?.image?.description}
            </TeaserImageCaption>
          </TeaserImageWrapper>
          {/* image end */}

          {/* author image start */}
          <TeaserAuthorImageWrapper>
            <TeaserImageInnerWrapper>
              {image && authors && authors?.length && (
                <TeaserAuthorImage
                  image={
                    authors.find(author => !!author.image) ?
                      (authors.find(author => !!author.image)
                        ?.image as FullImageFragment)
                    : image
                  }
                />
              )}
            </TeaserImageInnerWrapper>
          </TeaserAuthorImageWrapper>
          {/* author image end */}

          {/* meta start */}
          <Typography
            variant="teaserMeta"
            component={TeaserMetadata}
          >
            {authors && authors?.length ?
              <TeaserAuthors>
                <Trans
                  i18nKey="teaser.author.text"
                  values={{
                    authors: authors
                      ?.map(author => author.name)
                      .join(t('teaser.author.seperator')),
                  }}
                  components={{
                    TeaserAuthorTextWrapper: <TeaserAuthorTextWrapper />,
                    TeaserAuthorWrapper: <TeaserAuthorWrapper />,
                  }}
                />
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
