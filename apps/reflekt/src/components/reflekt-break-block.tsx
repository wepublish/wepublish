import styled from '@emotion/styled';
import { BreakBlock, BreakBlockButton } from '@wepublish/block-content/website';

import theme, { hasVariant } from '../theme';

const x = hasVariant(theme, 'MuiButton', 'contained');
console.log('reflekt-break-block:', x);

export const ReflektBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('xs')} {
    ${BreakBlockButton} {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      text-transform: uppercase;

      &:hover {
        background-color: ${({ theme }) => theme.palette.common.black};
        color: ${({ theme }) => theme.palette.common.white};
      }
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: calc((100% - 3rem) / 7 * 5) calc(
        (100% - 3rem) / 7 * 2
      );
    padding: 2rem 1rem;
    column-gap: 3rem;
    row-gap: 0;
  }
`;
