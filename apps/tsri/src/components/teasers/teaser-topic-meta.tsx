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

import { teaserTopicMetaTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserLead,
  TeaserPreTitle,
  TeaserTitle,
  TeaserWrapper,
} from './tsri-teaser';

export const isTeaserTopicMeta = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TopicMeta;
  },
]);

const TeaserTopicMetaBase = ({
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

export const StyledTeaserTopicMeta = styled(TeaserTopicMetaBase)`
  aspect-ratio: unset;
  container: unset;
  background-color: transparent;
  cursor: default;
  padding: 0 calc(var(--sizing-factor) * 1cqw) 0 0;

  ${TeaserContentWrapper} {
    grid-template-rows: repeat(2, min-content) auto;
    grid-template-columns: unset;
    border-radius: unset;
    background-color: transparent;

    &:hover {
      ${TeaserPreTitle} {
        background-color: transparent;
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }

  & ${TeaserTitle} {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }

  & ${TeaserLead} {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
  }

  & ${TeaserPreTitle} {
    grid-row: 3 / 4;
    grid-column: 1 / 2;
  }
`;

export const TeaserTopicMeta = createWithTheme(
  StyledTeaserTopicMeta,
  teaserTopicMetaTheme
);
