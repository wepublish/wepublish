import styled from '@emotion/styled';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { CSSProperties, ElementType, ReactNode, useId } from 'react';

import { PLAN_PADDING } from '../subscription-history/history-table';

/** A box with rounded corners, like the stacked subscription history's. */
export const SectionBoxWrapper = styled('section')`
  display: grid;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  // the heading band follows the rounding
  overflow: hidden;
`;

/** The section's title on a band, like the history table's header. */
export const SectionBoxTitle = styled('header')`
  background-color: ${({ theme }) => theme.palette.grey[100]};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1.5, PLAN_PADDING)};

  h2 {
    margin: 0;
  }
`;

/** Indented like the plan column of the history table. */
export const SectionBoxContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-items: start;
  padding: ${({ theme }) => theme.spacing(2, PLAN_PADDING)};

  & > * {
    margin: 0;
  }
`;

/** A table brings its own cell padding and lines. */
export const SectionBoxTableContent = styled('div')`
  & table {
    margin: 0;
  }

  & tr:last-of-type > td {
    border-bottom: none;
  }
`;

export type SectionBoxProps = {
  title: string;
  /** The heading's level; `h2` by default. */
  headingComponent?: ElementType;
  /** Content is a table: no indent of its own. */
  table?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * A titled section in a box: the subscription edit page's sections and the
 * profile's personal data and security.
 */
export function SectionBox({
  title,
  headingComponent = 'h2',
  table = false,
  className,
  style,
  children,
}: SectionBoxProps) {
  const {
    elements: { H6 },
  } = useWebsiteBuilder();
  const id = useId();
  const Content = table ? SectionBoxTableContent : SectionBoxContent;

  return (
    <SectionBoxWrapper
      aria-labelledby={id}
      className={className}
      style={style}
    >
      <SectionBoxTitle>
        <H6
          component={headingComponent}
          id={id}
        >
          {title}
        </H6>
      </SectionBoxTitle>

      <Content>{children}</Content>
    </SectionBoxWrapper>
  );
}
