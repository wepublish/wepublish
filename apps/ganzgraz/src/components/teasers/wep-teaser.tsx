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
  FullTeaserFragment,
} from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  Image,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export const selectTeaserAuthors = (teaser: FullTeaserFragment) => {
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

export const TeaserWrapper = styled('div')<FlexAlignment>`
  aspect-ratio: 16 / 9;
  background-color: transparent;
  cursor: pointer;
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

export const TeaserImageWrapper = styled('figure')`
  grid-row: 1 / 2;
  grid-column: -1 / 1;
  padding: 0;
  margin: 0;
  overflow: hidden;
  position: relative;
`;

export const TeaserImage = styled(Image)`
  max-height: 100%;
  height: 100%;
  width: 100%;
  object-fit: contain;
`;

export const TeaserImageInnerWrapper = styled('picture')`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const TeaserAuthorImageWrapper = styled('figure')`
  display: none;
`;

export const TeaserAuthorImage = styled(Image)`
  max-height: unset;
`;

export const TeaserImageCaption = styled('figcaption')`
  display: none;
`;

export const TeaserPeerLogo = styled(Image)``;

export const TeaserPreTitleNoContent = styled('div')``;

export const TeaserPreTitle = styled('div')``;

export const TeaserPreTitleWrapper = styled('div')``;

export const TeaserContentWrapper = styled('article')`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  gap: 0;
  border-radius: 0;

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
    ${TeaserPreTitle} {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4);
      font-weight: 500;
    }
  }
`;

export const TeaserTitle = styled('h1')``;

export const TeaserLead = styled('p')``;

export const TeaserAuthors = styled('span')``;

export const TeaserAuthorTextWrapper = styled('span')``;

export const TeaserAuthorWrapper = styled('span')``;

export const TeaserMetadata = styled('div')``;

export const TeaserTime = styled('time')``;

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

export const WepTeaser = ({
  teaser,
  alignment,
  className,
  blockStyle,
}: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (() => {
    const raw = (teaser && selectTeaserUrl(teaser)) ?? '';
    const transformPath = (path: string) => {
      const match = path.match(/^(\/.*)-(de|fr)$/);
      return match ? `/${match[2]}${match[1]}` : path;
    };
    try {
      const url = new URL(raw);
      url.pathname = transformPath(url.pathname);
      return url.toString();
    } catch {
      return transformPath(raw);
    }
  })();
  const target = (teaser && selectTeaserTarget(teaser)) ?? undefined;
  const image = teaser && selectTeaserImage(teaser);
  const peerLogo = teaser && selectTeaserPeerImage(teaser);
  const publishDate = teaser && selectTeaserDate(teaser);
  const authors = teaser && selectTeaserAuthors(teaser);

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
        </TeaserContent>
      </TeaserWrapper>
    )
  );
};
