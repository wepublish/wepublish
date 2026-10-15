import styled from '@emotion/styled';
import { BuilderContentWrapperProps } from '@wepublish/website/builder';

export const BkaContentWrapperStyled = styled('article')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: ${({ theme }) => theme.spacing(2)};
`;

export const BkaContentWrapper = ({
  children,
  className,
}: BuilderContentWrapperProps) => (
  <BkaContentWrapperStyled className={className}>
    {children}
  </BkaContentWrapperStyled>
);
