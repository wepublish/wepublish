import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { ReactNode } from 'react';

export const BlockSections = styled('div')`
  display: grid;
`;

export const BlockSection = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-block: ${({ theme }) => theme.spacing(3)};

  &:first-of-type {
    padding-top: 0;
  }

  &:last-of-type {
    padding-bottom: 0;
  }

  & + & {
    border-top: 1px solid ${({ theme }) => theme.vars.palette.divider};
  }
`;

const SectionHeader = styled('header')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

type BlockSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
};

export const BlockSectionHeader = ({
  title,
  description,
}: BlockSectionHeaderProps) => (
  <SectionHeader>
    <Typography
      variant="h6"
      component="h3"
    >
      {title}
    </Typography>

    {description && (
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {description}
      </Typography>
    )}
  </SectionHeader>
);
