import styled from '@emotion/styled';
import { BreakBlock, hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

import { courantTokens } from '../brand-tokens';

const TeamMemberBreakBlock = styled(BreakBlock)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'min(33.3%, 200px) 1fr',
    alignItems: 'start',
  },
  [theme.breakpoints.down('md')]: {
    justifyItems: 'center',
    textAlign: 'center',
  },
  '[class*="BreakBlockSegment"]': {
    [theme.breakpoints.up('md')]: {
      alignItems: 'start',
      alignSelf: 'start',
      justifyItems: 'start',
    },
    [theme.breakpoints.down('md')]: {
      justifyItems: 'center',
    },
  },
  '[class*="BreakBlockImage"]': {
    borderRadius: '50%',
    aspectRatio: '1 / 1',
    border: `4px solid ${courantTokens.colors.courant[500]}`,
    [theme.breakpoints.up('md')]: {
      width: '100%',
      maxWidth: 'none',
      marginLeft: 0,
      marginRight: 'auto',
    },
    [theme.breakpoints.down('md')]: {
      maxWidth: 200,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  '[class*="RichTextBlockWrapper"]': {
    maxWidth: 'none',
  },
  '[class*="RichTextBlockWrapper"] :is(p, li)': theme.typography.body1,
  '&&&': {
    [theme.breakpoints.up('md')]: {
      gridColumn: '3 / 11',
    },
  },
  'article[class*="CourantArticleContentWrapperStyled"] > &&&': {
    [theme.breakpoints.up('lg')]: {
      gridColumn: '4 / 10',
    },
  },
}));

export const CourantBreakBlock = (props: BuilderBreakBlockProps) => {
  if (hasBlockStyle('TeamMember')(props)) {
    return <TeamMemberBreakBlock {...props} />;
  }

  return <BreakBlock {...props} />;
};
