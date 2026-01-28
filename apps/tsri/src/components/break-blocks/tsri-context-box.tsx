import styled from '@emotion/styled';
import {
  ContextBox,
  ContextBoxCollapse,
  ContextBoxIcon,
  ContextBoxLine,
  ContextBoxTitle,
} from '@wepublish/block-content/website';

export const TsriContextBox = styled(ContextBox)`
  ${ContextBoxIcon} {
    display: none;
  }

  ${ContextBoxTitle} {
    grid-column: 2/3;
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  }

  ${ContextBoxTitle}, ${ContextBoxCollapse} {
    font-style: normal;
  }

  ${ContextBoxLine} {
    width: ${({ theme }) => theme.spacing(0.25)};
  }
`;
