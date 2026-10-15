import styled from '@emotion/styled';
import {
  TeaserSlotsBlock,
  TeaserSlotsBlockTeasers,
  TeaserSlotsBlockWrapper,
} from '@wepublish/block-content/website';

export const BkaArchiveTeaserSlots = styled(TeaserSlotsBlock)`
  gap: 0;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.palette.grey[100]};

  & + ${TeaserSlotsBlockWrapper} {
    margin-top: -${({ theme }) => theme.spacing(2)};
    padding-top: ${({ theme }) => theme.spacing(7)};
  }

  & > h1 {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(2.5)};
    margin: 0 0 ${({ theme }) => theme.spacing(2.5)};
    font-family: ${({ theme }) => theme.typography.body1.fontFamily};
    font-size: 1.75rem;
    font-weight: 400;
    line-height: 1.2;
    white-space: nowrap;

    &::after {
      content: '';
      flex-grow: 1;
      border-bottom: 1px solid currentColor;
    }
  }

  ${TeaserSlotsBlockTeasers} {
    column-gap: ${({ theme }) => theme.spacing(2.5)};
    row-gap: ${({ theme }) => theme.spacing(2.5)};
    grid-template-columns: repeat(2, minmax(0, 1fr));

    ${({ theme }) => theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    ${({ theme }) => theme.breakpoints.up('lg')} {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
`;
