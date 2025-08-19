import styled from '@emotion/styled';
import {
  ListicleBlock,
  ListicleBlockItemCounter,
  ListicleImage,
  ListicleItemTitle,
  ListicleRichtText,
} from '@wepublish/block-content/website';

export const HauptstadtListicle = styled(ListicleBlock)`
  ${ListicleBlockItemCounter} {
    display: none;
  }

  ${ListicleImage} {
    order: 1;
  }

  ${ListicleItemTitle} {
    order: 2;
    ${({ theme }) => theme.typography.h4};
    justify-self: start;
  }

  ${ListicleRichtText} {
    order: 3;
  }
`;
