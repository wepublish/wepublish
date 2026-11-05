import styled from '@emotion/styled';
import { css } from '@mui/material';
import { BreakBlock } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

export const CTABreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.primary.main};
  padding: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(4)};

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      padding: ${theme.spacing(9)};
      margin-top: ${theme.spacing(10)};
      margin-bottom: ${theme.spacing(10)};
      gap: ${theme.spacing(10)};
      grid-template-columns: 1fr 1fr;
    }
  `}
`;

export const GruppettoBreakBlock = (props: BuilderBreakBlockProps) => {
  if (props.hideButton) {
    return <BreakBlock {...props} />;
  }

  return <CTABreakBlock {...props} />;
};
