import styled from '@emotion/styled';

export const Container = styled('main')`
  display: grid;
  grid-template-columns: 1fr minmax(auto, 100vw) 1fr;
  grid-template-areas: '. content .';

  & > * {
    grid-area: content;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: 1fr minmax(auto, 940px) 1fr;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr minmax(auto, 1200px) 1fr;
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    grid-template-columns: 1fr minmax(auto, 1440px) 1fr;
  }
`;
