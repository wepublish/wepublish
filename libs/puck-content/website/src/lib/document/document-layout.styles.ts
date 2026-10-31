import styled from '@emotion/styled';

export const DocumentLayoutContainer = styled('div')`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

export const DocumentLayoutContent = styled('div')`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  > * {
    flex-grow: 1;
  }
`;

export const DocumentLayoutNoInteraction = styled('div')`
  * {
    pointer-events: none !important;
  }
`;
