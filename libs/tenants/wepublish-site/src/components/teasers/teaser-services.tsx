import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { hasBlockStyle } from '@wepublish/block-content/website';
import {
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { teaserServices } from '../../theme';
import { WepBlockStyles } from '../block-styles/wep-block-styles';
import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  TeaserWrapper,
} from './wep-teaser';

export const isTeaserServices = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(WepBlockStyles.TeaserServices)({ blockStyle }),
]);

const TeaserBase = ({ teaser, alignment, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const preTitle = teaser && selectTeaserPreTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';
  const openInNewTab = teaser ? selectTeaserTarget(teaser) : undefined;

  const {
    elements: { Link },
  } = useWebsiteBuilder();

  return (
    <TeaserWrapper
      {...alignment}
      className={className}
    >
      <TeaserContentWrapper>
        {title && (
          <Typography
            component={TeaserTitle}
            variant="teaserTitle"
          >
            {title}
          </Typography>
        )}
        {lead && (
          <Typography
            component={TeaserLead}
            variant="teaserLead"
          >
            {lead}
          </Typography>
        )}

        {preTitle && (
          <Typography
            variant="teaserPretitle"
            component={TeaserPreTitle}
          >
            {href ?
              <Link
                href={href}
                target={openInNewTab}
                variant="teaserPretitleLink"
              >
                {preTitle}
              </Link>
            : <>{preTitle}</>}
          </Typography>
        )}
      </TeaserContentWrapper>
    </TeaserWrapper>
  );
};

const WepTeaserStyled = styled(TeaserBase)`
  aspect-ratio: unset;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: 1fr;
  cursor: default;
  background-color: transparent;
  padding: ${({ theme }) => theme.spacing(0)};
  row-gap: ${({ theme }) => theme.spacing(2.5)};

  ${TeaserContentWrapper} {
    display: contents;

    &:hover {
      ${TeaserPreTitle} {
        background-color: transparent;
        color: ${({ theme }) => theme.palette.common.black};
        box-shadow: none;
        font-weight: 400;
      }
    }
  }

  ${TeaserImageWrapper} {
    display: none;
  }

  ${TeaserTitle} {
    grid-row: 1 / 2;
    font-size:;
  }

  ${TeaserLead} {
    grid-row: 2 / 3;
  }

  ${TeaserPreTitleWrapper} {
    grid-row: 3 / 4;
  }

  ${TeaserPreTitle} {
    display: block;
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${TeaserAuthors} {
    display: none;
  }

  ${TeaserTime} {
    display: none;
  }
`;

export const TeaserServices = createWithTheme(WepTeaserStyled, teaserServices);
