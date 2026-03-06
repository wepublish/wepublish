import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserPeerImage,
  selectTeaserPreTitle,
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

export const selectTeaserLeadColor = (teaser: TeaserType) => {
  let leadColor = 'white';

  if (teaser.__typename === 'ArticleTeaser') {
    leadColor =
      (
        teaser.article?.latest?.properties.find(
          property => property.key === 'leadColor'
        )?.value
      ) ?
        'black'
      : 'white';
  }
  return leadColor;
};

export const TeaserWrapper = styled('div')<FlexAlignment>`
  list-style: none;
  aspect-ratio: 365/380;
  overflow: hidden;
  background-color: transparent;
  cursor: pointer;
  container: teaser/inline-size;
  display: grid;
  position: relative;

  ${({ theme, w }) =>
    w > 6 &&
    css`
      grid-column: 1 / -1;
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

export const TeaserPreTitleNoContent = styled('div')``;

export const TeaserPreTitle = styled('div')``;

export const TeaserPreTitleWrapper = styled('div')`
  grid-row: 1 / 2;
  grid-column: -1 / 1;
  visibility: hidden;
`;

export const TeaserContentWrapper = styled('article')`
  overflow: hidden;
  display: grid;
  grid-template-rows: 10% 40% 50%;
  grid-template-columns: 1fr;
  gap: 0;
  row-gap: 1.125rem;
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  color: ${({ theme }) => theme.palette.common.white};

  & > * {
    user-select: none;
    pointer-events: none;
    cursor: pointer;
  }

  & a {
    pointer-events: all;
    cursor: pointer;
  }

  &:hover {
    background-color: ${({ theme }) => theme.palette.secondary.dark};
  }
`;

export const TeaserTitle = styled('h1')`
  grid-row: 2 / 3;
  grid-column: -1 / 1;
`;

export const TeaserLead = styled('p')`
  grid-row: 3 / 4;
  grid-column: -1 / 1;
  padding: 0 1.125rem;
`;

export const TeaserMetadata = styled('div')`
  display: contents;
  visibility: collapse;
`;

export const TeaserTime = styled('time')`
  grid-row: 1 / 2;
  grid-column: -1 / 1;
  visibility: visible;
  text-align: center;
`;

export const TeaserImageWrapper = styled('figure')`
  display: none;
`;

export const TeaserImageInnerWrapper = styled('picture')``;

export const TeaserImage = styled(Image)``;

export const TeaserBreakingNewsBadge = styled('div')`
  display: none;
`;

export const TeaserAuthorImageWrapper = styled('figure')`
  display: none;
`;

export const TeaserAuthorImage = styled(Image)`
  display: none;
`;

export const TeaserImageCaption = styled('figcaption')`
  display: none;
`;

export const TeaserPeerLogo = styled(Image)`
  display: none;
`;

export const TeaserAuthors = styled('span')`
  display: none;
`;

export const TeaserAuthorTextWrapper = styled('span')`
  display: none;
`;

export const TeaserAuthorWrapper = styled('span')`
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
  return (
    <TeaserContentWrapper className={className}>
      {children}
    </TeaserContentWrapper>
  );
};

export const ReflektTeaser = ({
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
  const breaking =
    teaser && 'article' in teaser && teaser.article?.latest.breaking;
  const leadColor = teaser && selectTeaserLeadColor(teaser);

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
                target={target}
                variant="teaserTitleLink"
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
              sx={{ color: leadColor }}
              component={TeaserLead}
            >
              {lead}
            </Typography>
          )}
          {/* lead end */}

          {/* image start */}
          <TeaserImageWrapper>
            <TeaserImageInnerWrapper>
              {image && breaking && (
                <TeaserBreakingNewsBadge>
                  <span>
                    TOP
                    <br />
                  </span>
                  STORY
                </TeaserBreakingNewsBadge>
              )}
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
        </TeaserContent>
      </TeaserWrapper>
    )
  );
};
