import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockPreTitle,
} from '@wepublish/block-content/website';

export const HauptstadtTitleBlock = styled(TitleBlock)`
  gap: ${({ theme }) => theme.spacing(3.5)};

  ${TitleBlockPreTitle} {
    margin-bottom: -${({ theme }) => theme.spacing(2)};
  }
`;
