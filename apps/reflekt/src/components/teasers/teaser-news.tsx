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
  --news-title-min: 1.1rem;
  --news-title-fluid: 8.5cqi;
  --news-title-max: 2rem;

  --news-lead-min: 0.8rem;
  --news-lead-fluid: 4.9cqi;
  --news-lead-max: 1.125rem;

  --news-time-min: 0.6rem;
  --news-time-fluid: 3cqi;
  --news-time-max: 0.75rem;

  ${TeaserContentWrapper} {
    padding: 0 clamp(0.5rem, 4cqi, 1rem);
    row-gap: clamp(0.5rem, 5cqi, 1.125rem);
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
    padding-top: clamp(0.35rem, 3cqi, 0.75rem);
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
    padding: 0 clamp(0.5rem, 5cqi, 1.125rem);
  }
`;
