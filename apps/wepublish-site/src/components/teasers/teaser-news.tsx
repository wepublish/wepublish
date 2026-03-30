import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  hasBlockStyle,
  selectTeaserImage,
  selectTeaserPeerImage,
} from '@wepublish/block-content/website';
import {
  selectTeaserAuthors,
  selectTeaserDate,
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import { FullImageFragment } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { Trans, useTranslation } from 'react-i18next';

import { teaserNews } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import {
  TeaserAuthorImage,
  TeaserAuthorImageWrapper,
  TeaserAuthors,
  TeaserAuthorTextWrapper,
  TeaserAuthorWrapper,
  TeaserContent,
  TeaserContentWrapper,
  TeaserImage,
  TeaserImageCaption,
  TeaserImageInnerWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPeerLogo,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  TeaserWrapper,
} from './wep-teaser';

export const isTeaserNews = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(WepBlockStyles.TeaserNews)({ blockStyle }),
]);

const BaseTeaser = ({
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
    const match = raw.match(/^(.*)-([a-z]{2})$/);
    if (match) {
      return `/${match[2]}${match[1]}`;
    }
    return raw;
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
            {title}
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
                <TeaserAuthorImage image={image as FullImageFragment} />
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
                    authors: authors?.join(t('teaser.author.seperator')),
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

const WepTeaserStyled = styled(BaseTeaser)`
  aspect-ratio: unset;
  grid-template-rows: minmax(auto, 220px) repeat(2, auto);
  grid-template-columns: 1fr;
  cursor: default;
  background-color: transparent;
  padding: ${({ theme }) => theme.spacing(0)};
  row-gap: ${({ theme }) => theme.spacing(1.5)};

  ${TeaserContentWrapper} {
    display: contents;
  }

  ${TeaserImageWrapper} {
    grid-row: 1 / 2;
  }

  ${TeaserTitle} {
    grid-row: 2 / 3;
    font-size:;
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitle} {
    display: none;
  }

  ${TeaserMetadata} {
    display: block;
    align-self: end;
  }

  ${TeaserAuthors} {
    display: contents;
  }

  ${TeaserTime} {
    display: contents;
  }
`;

export const TeaserNews = createWithTheme(WepTeaserStyled, teaserNews);
