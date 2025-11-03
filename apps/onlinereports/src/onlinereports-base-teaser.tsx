import styled from '@emotion/styled';
import { Box, css, useTheme } from '@mui/material';
import {
  BaseTeaser,
  selectTeaserTags,
  TeaserAuthors,
  TeaserImageWrapper,
  TeaserLead,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTags,
  TeaserTime,
  TeaserTitle,
  TeaserWrapper,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { useMemo } from 'react';

import { Advertisement } from './components/advertisement';

export const useImageStyles = () => {
  const theme = useTheme();

  return useMemo(
    () => css`
      max-height: 400px;
      width: 100%;
      object-fit: cover;
      grid-column: 1/13;
      transition: transform 0.3s ease-in-out;
      aspect-ratio: 4/3;

      :where(${TeaserWrapper}:hover &) {
        transform: scale(1);
      }

      ${theme.breakpoints.up('md')} {
        aspect-ratio: 4/3;
      }
    `,
    [theme]
  );
};

const hasTags = (teaser: BuilderTeaserProps['teaser']) => {
  if (!teaser) {
    return false;
  }
  return selectTeaserTags(teaser).length > 0;
};

export const OnlineReportsTeaserTitleWrapper = styled('h2')`
  grid-area: title;
  font-size: 24px !important;
`;

export const OnlineReportsTeaserPreTitleWrapper = styled(Box)``;

export const OnlineReportsBaseTeaser = (props: BuilderTeaserProps) => {
  if (props.teaser?.title === 'ad-small') {
    return (
      <TeaserWrapper {...props.alignment}>
        <Advertisement type={'small'} />
      </TeaserWrapper>
    );
  }

  if (props.teaser?.title === 'ad-halfpage') {
    return (
      <TeaserWrapper {...props.alignment}>
        <Advertisement type={'half-page'} />
      </TeaserWrapper>
    );
  }

  if (props.teaser?.title === 'ad-wideboard') {
    return (
      <TeaserWrapper {...props.alignment}>
        <Advertisement type={'whiteboard'} />
      </TeaserWrapper>
    );
  }

  return <OnlineReportsBaseTeaserStyled {...props} />;
};
export const OnlineReportsBaseTeaserStyled = styled(BaseTeaser)`
  color: inherit;
  text-decoration: none;
  display: grid;

  grid-template-areas:
    'image'
    '.'
    'pretitle'
    'title'
    'lead'
    'tags'
    'authors';
  grid-template-rows: repeat(6, min-content);

  .MuiChip-root {
    color: inherit;
    border-color: inherit;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserImageWrapper} {
    &:empty {
      display: none;

      ${({ theme }) => theme.breakpoints.up('sm')} {
        display: unset;
      }
    }

    img {
      aspect-ratio: 4/3;
      max-height: unset;
    }

    :where(${TeaserWrapper}:hover &) img {
      transform: unset;
    }
  }

  ${TeaserPreTitleWrapper} {
    margin-bottom: 0;
    padding: ${({ theme }) => theme.spacing(0.5)} 0 0 0;
    height: unset;
    color: ${({ theme }) => theme.palette.primary.main};
    background-color: transparent;
    grid-area: pretitle;
  }

  ${TeaserPreTitle} {
    transform: none;
    padding: 0;
    background-color: transparent;
    color: ${({ theme }) => theme.palette.primary.main};
    font-weight: 600;
    width: 100%;
  }

  ${TeaserTitle} {
    font-family: ${({ theme }) => theme.typography.h3.fontFamily};
    font-size: ${({ theme }) => theme.typography.h3.fontSize};
    font-weight: ${({ theme }) => theme.typography.h3.fontWeight};
    color: ${({ theme }) => theme.typography.h3.color};
    margin-bottom: ${({ theme }) => theme.spacing(0.25)};
    ${({ theme }) => theme.breakpoints.up('sm')} {
      margin-bottom: ${({ theme }) => theme.spacing(1)};
    }
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserTags} {
    display: ${({ teaser }) => (hasTags(teaser) ? 'block' : 'none')};

    & .MuiChip-root {
      background-color: #7c7c7c;
      border-radius: 5px;
      border: none;
      color: #fff;
      padding: 4px 12px;
      margin-top: 6px;

      ${({ theme }) => theme.breakpoints.up('lg')} {
        margin-top: 2px;
      }
    }
  }

  ${TeaserAuthors} {
    display: ${({ teaser }) => (hasTags(teaser) ? 'none' : 'block')};
    font-family: ${({ theme }) => theme.typography.body2.fontFamily};
    font-size: ${({ theme }) => theme.typography.body2.fontSize};
    font-weight: ${({ theme }) => theme.typography.body2.fontWeight};
    color: ${({ theme }) => theme.typography.body2.color};
  }

  ${TeaserTime} {
    display: none;
  }
`;
