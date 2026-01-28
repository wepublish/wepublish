import styled from '@emotion/styled';
import { TeaserGridBlock } from '@wepublish/block-content/website';

export const OnlineReportsTeaserGridBlock = styled(TeaserGridBlock)`
  row-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    row-gap: ${({ theme }) => theme.spacing(5)};
  }
`;
