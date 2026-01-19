import styled from '@emotion/styled';
import { FlexBlock } from '@wepublish/block-content/website';

export const FlexBlockSmallRowGaps = styled(FlexBlock)`
  row-gap: 4cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.25cqw;
  }
`;
