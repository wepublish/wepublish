import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import {
  ReflektTeaser,
  TeaserContentWrapper,
  TeaserLead,
  TeaserPreTitleNoContent,
  TeaserTime,
  TeaserTitle,
} from './reflekt-teaser';

export const isTeaserNews =
  hasBlockStyle(ReflektBlockStyles.TeaserNews) ||
  hasBlockStyle(ReflektBlockStyles.TeaserNewsGrid);

export const TeaserNews = styled(ReflektTeaser)`
  --tw: calc(100vw - 64px);

  ${({ theme }) => theme.breakpoints.up('md')} {
    --tw: clamp(258px, calc(33.05vw - 39.4px), 356px);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --tw: clamp(335px, calc(14.29vw + 173.1px), 356px);
  }

  --news-title-min: 1.1rem;
  --news-title-fluid: calc(var(--tw, 100cqi) * 8.5 / 100);
  --news-title-max: 2rem;

  --news-lead-min: 0.8rem;
  --news-lead-fluid: calc(var(--tw, 100cqi) * 4.9 / 100);
  --news-lead-max: 1.125rem;

  --news-time-min: 0.6rem;
  --news-time-fluid: calc(var(--tw, 100cqi) * 3 / 100);
  --news-time-max: 0.75rem;

  ${TeaserContentWrapper} {
    padding: 0 clamp(0.5rem, calc(var(--tw, 100cqi) * 4 / 100), 1rem);
    row-gap: clamp(0.5rem, calc(var(--tw, 100cqi) * 5 / 100), 1.125rem);
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserTime} {
    font-size: clamp(
      var(--news-time-min),
      var(--news-time-fluid),
      var(--news-time-max)
    );
    padding-top: clamp(0.35rem, calc(var(--tw, 100cqi) * 3 / 100), 0.75rem);
  }

  ${TeaserTitle} {
    font-size: clamp(
      var(--news-title-min),
      var(--news-title-fluid),
      var(--news-title-max)
    );
  }

  ${TeaserLead} {
    font-size: clamp(
      var(--news-lead-min),
      var(--news-lead-fluid),
      var(--news-lead-max)
    );
    padding: 0 clamp(0.5rem, calc(var(--tw, 100cqi) * 5 / 100), 1.125rem);
  }
`;
