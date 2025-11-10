import styled from '@emotion/styled';
import { Pagination as MuiPagination } from '@mui/material';
import { ComponentProps } from 'react';

export type PaginationProps = ComponentProps<typeof MuiPagination>;

export const CenteredPagination = styled(MuiPagination)`
  display: grid;
  justify-items: center;
`;

export function Pagination({ className, ...props }: PaginationProps) {
  return <CenteredPagination {...props} />;
}
