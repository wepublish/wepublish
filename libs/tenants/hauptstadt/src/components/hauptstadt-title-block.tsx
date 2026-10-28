import styled from '@emotion/styled';
import {
  TitleBlock,
  TitleBlockPreTitleWrapper,
} from '@wepublish/block-content/website';
import { BuilderTitleBlockProps } from '@wepublish/website/builder';

import { HauptstadtTitleBlockPreTitle } from './hauptstadt-premium-indicator';

const TitleBlockWithAboPlus = (props: BuilderTitleBlockProps) => {
  return (
    <TitleBlock
      {...props}
      PreTitle={HauptstadtTitleBlockPreTitle}
    />
  );
};

export const HauptstadtTitleBlock = styled(TitleBlockWithAboPlus)`
  gap: ${({ theme }) => theme.spacing(3.5)};

  ${TitleBlockPreTitleWrapper} {
    margin-bottom: 0;
  }
`;
