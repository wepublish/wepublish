import styled from '@emotion/styled';
import {
  TeaserSlotsBlock,
  TeaserSlotsBlockTeasers,
} from '@wepublish/block-content/website';

export const BkaTeaserSlots = styled(TeaserSlotsBlock)`
  gap: ${({ theme }) => theme.spacing(2)};

  & > h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.typography.body1.fontFamily};
    font-size: ${({ theme }) => theme.typography.subtitle1.fontSize};
    font-weight: 400;
    line-height: ${({ theme }) => theme.typography.h1.lineHeight};
    text-align: center;
  }

  ${TeaserSlotsBlockTeasers} {
    grid-template-columns: 1fr;
    row-gap: ${({ theme }) => theme.spacing(1.875)};

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: 1fr;
    }
  }
`;
