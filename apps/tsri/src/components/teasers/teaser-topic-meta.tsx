import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  selectTeaserLead,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

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

export const TeaserTopicMetaBase = ({
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
        {title && <Typography component={TeaserTitle}>{title}</Typography>}
        {lead && <Typography component={TeaserLead}>{lead}</Typography>}

        {preTitle && (
          <TeaserPreTitle>
            {href ?
              <Link
                href={href}
                target={openInNewTab}
                color="inherit"
                underline="none"
              >
                {preTitle}
              </Link>
            : <>{preTitle}</>}
          </TeaserPreTitle>
        )}
      </TeaserContentWrapper>
    </TeaserWrapper>
  );
};

export const TeaserTopicMeta = styled(TeaserTopicMetaBase)`
  aspect-ratio: unset;
  container: unset;
  background-color: transparent;
  cursor: default;
  padding: 0 calc(var(--sizing-factor) * 1cqw) 0 0;

  & * {
    background-color: transparent;
  }

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
    padding: 0;
    margin: 0 0 calc(var(--sizing-factor) * 1cqw) 0 !important;
    font-size: calc(var(--sizing-factor) * 1.67cqw) !important;
    line-height: calc(var(--sizing-factor) * 1.8cqw) !important;
    font-weight: 700 !important;
    color: ${({ theme }) => theme.palette.common.black};
    background-color: transparent;
  }

  & ${TeaserLead} {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    display: block;
    font-size: calc(var(--sizing-factor) * 1.3cqw) !important;
    line-height: calc(var(--sizing-factor) * 1.4cqw) !important;
    font-weight: 400 !important;
    padding: 0;
    background-color: transparent;
    color: ${({ theme }) => theme.palette.common.black};
  }

  & ${TeaserPreTitle} {
    grid-row: 3 / 4;
    grid-column: 1 / 2;
    font-size: calc(var(--sizing-factor) * 1.1cqw) !important;
    font-weight: 700 !important;
    line-height: calc(var(--sizing-factor) * 1.2cqw) !important;
    text-align: right;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    background-color: transparent;
    color: ${({ theme }) => theme.palette.common.black};
    justify-self: end;
    padding-right: 0;

    & .MuiLink-root {
      display: inline;
      text-decoration: underline;
      flex-grow: 0;
      padding: calc(var(--sizing-factor) * 0.3cqw)
        calc(var(--sizing-factor) * 0.5cqw);

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
        text-decoration: none;
      }
    }
  }
`;
