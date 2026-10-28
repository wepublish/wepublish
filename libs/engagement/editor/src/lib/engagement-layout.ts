import styled from '@emotion/styled';

// Columns follow the width of the page content, not the window: the sidebar
// takes a good part of it.
export const RuleContainer = styled('div')`
  container-type: inline-size;
`;

/** The rule's settings on the left, its stages on the right. */
export const RuleColumns = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing(2)};

  @container (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
`;
