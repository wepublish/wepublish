import styled from '@emotion/styled';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

export const FormLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FormColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography
            variant="h6"
            component="h2"
          >
            {title}
          </Typography>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}
