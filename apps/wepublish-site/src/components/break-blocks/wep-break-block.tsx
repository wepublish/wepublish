import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockImage,
  BreakBlockSegment,
  BreakBlockButton,
} from '@wepublish/block-content/website';

export const WepBreakBlock = styled(BreakBlock)`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    padding: 0;
    column-gap: ${({ theme }) => theme.spacing(3)};
    justify-items: start;
    align-items: start;
  }

  ${BreakBlockSegment} {
    align-items: flex-start;
  }

  ${BreakBlockImage} {
    width: 100%;
    max-width: 100%;
  }

  ${BreakBlockButton} {
    border-radius: 3px;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    padding: ${({ theme }) => theme.spacing(1)}
      ${({ theme }) => theme.spacing(3)};
    transition: none;
    font-weight: 400;

    &:hover {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      font-weight: 500;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.4);
    }
  }
`;
