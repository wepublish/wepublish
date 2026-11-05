import styled, { CSSObject } from '@emotion/styled';
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
    ${({ theme }) => theme.typography.h4 as CSSObject};
    order: 2;
    justify-self: start;
  }

  ${ListicleRichtText} {
    order: 3;
  }
`;
