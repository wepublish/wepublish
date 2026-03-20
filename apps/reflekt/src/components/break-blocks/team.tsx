import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockButton,
  BreakBlockImage,
  BreakBlockSegment,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const isTeamBreakBlock = allPass([
  ({ blockStyle }: BuilderBreakBlockProps) => {
    return blockStyle === ReflektBlockType.Team;
  },
]);

export const TeamBreakBlock = styled(BreakBlock)`
  background-color: transparent;
  color: ${({ theme }) => theme.palette.common.black};

  ${BreakBlockImage} {
    width: 100%;
    height: auto;
    max-height: 100%;
    max-width: 100%;
  }

  ${BreakBlockSegment} + ${BreakBlockSegment} {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  ${RichTextBlockWrapper} {
    max-width: 65%;
  }

  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-template-columns: unset;
    grid-template-rows: repeat(2, auto);
    padding: 4rem 0;
    column-gap: 0;
    row-gap: 2rem;

    ${BreakBlockButton} {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      text-transform: uppercase;

      &:hover {
        background-color: ${({ theme }) => theme.palette.common.black};
        color: ${({ theme }) => theme.palette.common.white};
      }
    }

`;
