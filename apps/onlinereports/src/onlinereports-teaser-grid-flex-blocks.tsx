import styled from '@emotion/styled';
import { TeaserGridFlexBlock } from '@wepublish/block-content/website';

export const OnlineReportsTeaserGridFlexBlock = styled(TeaserGridFlexBlock)`
  row-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(5)};
  }
`;
