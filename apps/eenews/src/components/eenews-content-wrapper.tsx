import styled from '@emotion/styled';
import {
  CfInner,
  CrowdfundingContainer,
} from '@wepublish/block-content/website';
import { ContentWrapperStyled } from '@wepublish/content/website';

export const EenewsContentWrapper = styled(ContentWrapperStyled)`
  & {
    row-gap: 0;
  }

  & > ${CrowdfundingContainer} {
    margin-bottom: 32px;
  }

  & > ${CrowdfundingContainer} > ${CfInner} > :first-child {
    margin-left: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    & > ${CrowdfundingContainer} {
      grid-column: -1/1;
    }
  }
`;
