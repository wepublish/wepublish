import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { ReactNode, useState } from 'react';

import { FaChevronDown } from 'react-icons/fa6';

export const BkaCollapsibleCardWrapper = styled('div')`
  border-radius: 4px;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};

  &[data-variant='light'] {
    border: 1.5px solid ${({ theme }) => theme.palette.common.black};
    background-color: ${({ theme }) => theme.palette.common.white};
    color: ${({ theme }) => theme.palette.common.black};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    padding: 18px;

    &[data-variant='light'] {
      padding: 0;
      border: 0;
      background-color: transparent;
    }
  }
`;

export const BkaCollapsibleCardChevron = styled(FaChevronDown)`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 0.2s ease-in-out;
`;

export const BkaCollapsibleCardToggler = styled('button')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 0;
  background: none;
  color: inherit;
  font-family: ${({ theme }) => theme.typography.body1.fontFamily};
  font-size: 1.25rem;
  font-weight: 400;
  line-height: ${({ theme }) => theme.typography.body1.lineHeight};
  text-align: left;
  cursor: pointer;

  &[aria-expanded='true'] ${BkaCollapsibleCardChevron} {
    transform: rotate(180deg);
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    padding: 0 0 ${({ theme }) => theme.spacing(1)};
    border-bottom: 1.5px solid currentColor;
    ${({ theme }) => css(theme.typography.h4)}
    pointer-events: none;

    ${BkaCollapsibleCardChevron} {
      display: none;
    }
  }
`;

export const BkaCollapsibleCardContent = styled('div')`
  display: none;
  padding: ${({ theme }) => theme.spacing(0, 1, 1)};

  &::before {
    content: '';
    display: block;
    height: 1.5px;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    background-color: currentColor;
  }

  &[data-open='true'] {
    display: block;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    display: block;
    padding: 0;

    &::before {
      display: none;
    }
  }
`;

export type BkaCollapsibleCardProps = {
  title: ReactNode;
  icon?: ReactNode;
  variant?: 'dark' | 'light';
  children?: ReactNode;
  className?: string;
};

export const BkaCollapsibleCard = ({
  title,
  icon,
  variant = 'dark',
  children,
  className,
}: BkaCollapsibleCardProps) => {
  const [open, setOpen] = useState(false);

  return (
    <BkaCollapsibleCardWrapper
      className={className}
      data-variant={variant}
    >
      <BkaCollapsibleCardToggler
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(wasOpen => !wasOpen)}
      >
        {icon}
        {title}
        <BkaCollapsibleCardChevron />
      </BkaCollapsibleCardToggler>

      <BkaCollapsibleCardContent data-open={open}>
        {children}
      </BkaCollapsibleCardContent>
    </BkaCollapsibleCardWrapper>
  );
};
