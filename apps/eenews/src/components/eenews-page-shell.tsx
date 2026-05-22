import styled from '@emotion/styled';
import { PropsWithChildren } from 'react';

const Shell = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
  padding: 56px;
  box-sizing: border-box;
  width: 100%;

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

export const EenewsPageShell = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  return <Shell className={className}>{children}</Shell>;
};
