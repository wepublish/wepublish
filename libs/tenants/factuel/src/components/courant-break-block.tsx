import { css, CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockImage,
  BreakBlockSegment,
  hasBlockStyle,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { FullImageFragment } from '@wepublish/website/api';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';
import teamPlaceholder from '../team-placeholder.png';

const url = teamPlaceholder as unknown as string;

const teamPlaceholderImage: FullImageFragment = {
  __typename: 'Image',
  id: 'team-placeholder',
  width: 600,
  height: 600,
  focalPointX: 0.5,
  focalPointY: 0.5,
  title: null,
  description: null,
  source: null,
  link: null,
  license: null,
  url,
  xxxl: url,
  xxl: url,
  xl: url,
  l: url,
  m: url,
  s: url,
  xs: url,
  xxs: url,
  xxxlSquare: url,
  xxlSquare: url,
  xlSquare: url,
  lSquare: url,
  mSquare: url,
  sSquare: url,
  xsSquare: url,
  xxsSquare: url,
};

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
    const image = props.image ?? teamPlaceholderImage;
    return (
      <TeamMemberBreakBlock
        {...props}
        image={image}
      />
    );
  }

  return <BreakBlock {...props} />;
};
