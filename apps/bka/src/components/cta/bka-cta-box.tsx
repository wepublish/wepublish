import styled from '@emotion/styled';
import { Button, Link } from '@wepublish/website/builder';
import { ReactNode } from 'react';

import { FaArrowRightLong } from 'react-icons/fa6';

import { BkaCollapsibleCard } from './bka-collapsible-card';

export const BkaCtaBoxBody = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  hyphens: manual;
  word-break: normal;
  overflow-wrap: normal;

  & p {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
  }
`;

export const BkaCtaBoxSecondaryLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  line-height: ${({ theme }) => theme.typography.h6.lineHeight};
  font-weight: 700;
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

export const BkaCtaBoxActions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2.5)};
`;

export const BkaCtaBoxButton = styled(Button)`
  gap: ${({ theme }) => theme.spacing(1)};
  padding: 6px ${({ theme }) => theme.spacing(1.5)};
`;

export type BkaCtaBoxProps = {
  title: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

export const BkaCtaBox = ({
  title,
  icon,
  children,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  className,
}: BkaCtaBoxProps) => (
  <BkaCollapsibleCard
    className={className}
    title={title}
    icon={icon}
  >
    {children && <BkaCtaBoxBody>{children}</BkaCtaBoxBody>}

    <BkaCtaBoxActions>
      {secondaryLabel && secondaryHref && (
        <BkaCtaBoxSecondaryLink
          href={secondaryHref}
          color="inherit"
        >
          {secondaryLabel}
        </BkaCtaBoxSecondaryLink>
      )}

      {actionLabel && actionHref && (
        <BkaCtaBoxButton
          variant="outlined"
          color="inherit"
          LinkComponent={Link}
          href={actionHref}
        >
          {actionLabel}
          <FaArrowRightLong size={20} />
        </BkaCtaBoxButton>
      )}
    </BkaCtaBoxActions>
  </BkaCollapsibleCard>
);
