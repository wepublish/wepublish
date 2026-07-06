import styled from '@emotion/styled';
import { TitleBlockPreTitleWrapper } from '@wepublish/block-content/website';
import { PropsWithChildren } from 'react';

const Shell = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 56px;
  box-sizing: border-box;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 28px;

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
    row-gap: 20px;
  }

  ${TitleBlockPreTitleWrapper} {
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.common.white};
    font-weight: 700;
  }
`;

export const EenewsPageShell = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  return <Shell className={className}>{children}</Shell>;
};
