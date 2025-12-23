import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockLead,
  TitleBlockTitle,
} from '@wepublish/block-content/website';

export const TsriTitleBlock = styled(TitleBlock)`
  ${TitleBlockLead} {
    font-size: 1.86cqw;
    line-height: 2.24cqw;
    font-weight: 700;
  }
  ${TitleBlockTitle} {
    font-size: 3.72cqw;
    line-height: 4.47cqw;
    font-weight: 700;
  }
`;
