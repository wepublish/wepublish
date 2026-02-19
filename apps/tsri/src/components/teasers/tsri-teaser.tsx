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

export const TeaserWrapper = styled('div')<FlexAlignment>`
  list-style: none;
  aspect-ratio: 16/9;
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

export const TeaserImageWrapper = styled('figure')`
  grid-row: 1 / 6;
  grid-column: 1/3;
  padding: 0;
  margin: 0;
  overflow: hidden;
  z-index: -1;
  position: relative;
`;

export const TeaserImage = styled(Image)`
  max-height: 100%;
  max-width: 100%;
  object-fit: cover;
`;

export const TeaserBreakingNewsBadge = styled('div')`
  position: absolute;
  top: 6cqw;
  left: 5cqw;
  width: 15cqw;
  border-radius: 7.5cqw;
  text-align: center;
  aspect-ratio: 1;
  z-index: 2;
  font-weight: 700;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  transform: rotate(-20deg);
  color: ${({ theme }) => theme.palette.common.black};
  background-color: ${({ theme }) => theme.palette.primary.light};
  mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI1IiBoZWlnaHQ9IjEyNSIgdmlld0JveD0iMCAwIDEyNSAxMjUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8cGF0aCBkPSJNNjkuMSAtMy41TDYyLjYgMTUuM0w1NiAtMy41TDUzLjUgMTYuMkw0My4zIC0wLjhMNDQuOSAxOUwzMS4zIDQuNkwzNyAyMy42TDIwLjggMTIuM0wzMC4yIDI5LjdMMTIgMjIuMUwyNC45IDM3LjFMNS41IDMzLjRMMjEuMiA0NS41TDEuNCA0NS45TDE5LjMgNTQuNEwwIDU5TDE5LjMgNjMuNkwxLjQgNzIuMUwyMS4yIDcyLjVMNS41IDg0LjZMMjQuOSA4MC45TDEyIDk1LjlMMzAuMiA4OC4zTDIwLjggMTA1LjdMMzcgOTQuNEwzMS4zIDExMy40TDQ0LjkgOTlMNDMuMyAxMTguOEw1My41IDEwMS44TDU2IDEyMS41TDYyLjYgMTAyLjhMNjkuMSAxMjEuNUw3MS42IDEwMS44TDgxLjkgMTE4LjhMODAuMyA5OUw5My44IDExMy40TDg4LjIgOTQuNEwxMDQuNCAxMDUuN0w5NC45IDg4LjNMMTEzLjEgOTUuOUwxMDAuMyA4MC45TDExOS43IDg0LjZMMTA0IDcyLjVMMTIzLjcgNzIuMUwxMDUuOSA2My42TDEyNS4xIDU5TDEwNS45IDU0LjRMMTIzLjcgNDUuOUwxMDQgNDUuNUwxMTkuNyAzMy40TDEwMC4zIDM3LjFMMTEzLjEgMjIuMUw5NC45IDI5LjdMMTA0LjQgMTIuM0w4OC4yIDIzLjZMOTMuOCA0LjZMODAuMyAxOUw4MS45IC0wLjhMNzEuNiAxNi4yTDY5LjEgLTMuNVoiLz4KPC9zdmc+');
  mask-size: contain;

  line-height: calc((9 * 100cqw / 16) * 0.042);
  font-size: calc((9 * 100cqw / 16) * 0.052);
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-indent: -0.3cqw;

  & > span {
    letter-spacing: 0.1cqw;
    display: contents;
  }
`;

export const TeaserImageInnerWrapper = styled('picture')``;

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

export const TeaserPreTitleNoContent = styled('div')``;

export const TeaserPreTitle = styled('div')``;

export const TeaserPreTitleWrapper = styled('div')`
  grid-row: 2;
  grid-column: 2 / 3;
  background-color: transparent;
`;

export const TeaserContentWrapper = styled('article')`
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 6.25% auto 7.5% 6.75%;
  grid-template-columns: 50% 50%;
  gap: 0;
  border-radius: calc((9 * 100cqw / 16) * 0.03);

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
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.common.black};
    }
  }
`;

export const TeaserTitle = styled('h1')`
  grid-row: 3;
  grid-column: 2 / 3;
`;

export const TeaserLead = styled('p')``;

export const TeaserAuthors = styled('span')``;

export const TeaserAuthorTextWrapper = styled('span')``;

export const TeaserAuthorWrapper = styled('span')``;

export const TeaserMetadata = styled('div')`
  grid-row: 4;
  grid-column: 2 / 3;
`;

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
  const breaking =
    teaser && 'article' in teaser && teaser.article?.latest.breaking;

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
              {image && breaking && (
                <TeaserBreakingNewsBadge>
                  <span>
                    TOP
                    <br />
                  </span>
                  story
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
