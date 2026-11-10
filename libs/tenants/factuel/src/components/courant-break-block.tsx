import { css, CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockImage,
  BreakBlockSegment,
  hasBlockStyle,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';

export const TeamMemberBreakBlock = styled(BreakBlock)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: min(33.3%, 200px) 1fr;
    align-items: start;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    justify-items: center;
    text-align: center;
  }

  ${BreakBlockSegment} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      align-items: start;
      align-self: start;
      justify-items: start;
    }
    ${({ theme }) => theme.breakpoints.down('md')} {
      justify-items: center;
    }
  }

  ${BreakBlockImage} {
    border-radius: 50%;
    aspect-ratio: 1 / 1;
    border: 4px solid ${courantTokens.colors.courant[500]};
    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 100%;
      max-width: none;
      margin-left: 0;
      margin-right: auto;
    }
    ${({ theme }) => theme.breakpoints.down('md')} {
      max-width: 200px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  ${RichTextBlockWrapper} {
    max-width: none;
  }
  ${RichTextBlockWrapper} :is(p, li) {
    ${({ theme }) => css(theme.typography.body1 as CSSObject)};
  }
`;

export const CourantBreakBlock = (props: BuilderBreakBlockProps) => {
  if (hasBlockStyle('TeamMember')(props)) {
    return <TeamMemberBreakBlock {...props} />;
  }

  return <BreakBlock {...props} />;
};
