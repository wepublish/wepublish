import styled from '@emotion/styled';
import { Typography } from '@mui/material';
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

import { teaserMoreAboutTheme } from '../../theme';
import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import {
  TeaserContentWrapper,
  TeaserLead,
  TeaserPreTitle,
  TeaserTitle,
  TeaserWrapper,
} from './reflekt-teaser';

export const isTeaserMoreAbout = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === ReflektBlockType.TeaserMoreAbout;
  },
]);

const TeaserMoreAboutBase = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
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
                variant={'buttonLinkSecondary'}
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

export const StyledTeaserMoreAbout = styled(TeaserMoreAboutBase)`
  aspect-ratio: unset;
  container: unset;
  background-color: transparent;
  cursor: default;
  //padding: 0 calc(var(--sizing-factor) * 1cqw) 0 0;
  grid-row: unset !important;
  grid-column: -1 / 1 !important;

  ${TeaserContentWrapper} {
    grid-template-rows: unset;
    grid-template-columns: unset;
    border-radius: unset;
    background-color: transparent;
    justify-content: center;
    display: flex;
    flex-direction: row;

    &:hover {
      background-color: transparent;
    }
  }

  & ${TeaserTitle} {
    display: none;
  }

  & ${TeaserLead} {
    display: none;
  }

  & ${TeaserPreTitle} {
    padding: 0;
    margin: 0 0 6rem 0;
    text-transform: uppercase;
  }
`;

export const TeaserMoreAbout = createWithTheme(
  StyledTeaserMoreAbout,
  teaserMoreAboutTheme
);
