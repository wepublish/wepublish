import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import {
  SearchPage,
  SearchPageGetServerSideProps,
} from '@wepublish/utils/website';
import { ComponentProps } from 'react';

import { eenewsColors } from '../src/theme';

const Stage = styled('section')`
  padding: 72px 0 56px;
  border-bottom: 1px solid ${eenewsColors.rule};
`;

const StageInner = styled(Container)`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ResultsWrap = styled(Container)`
  padding: 56px 0 80px;
`;

export default function Search(props: ComponentProps<typeof SearchPage>) {
  return (
    <>
      <Stage>
        <StageInner>
          <Typography
            variant="metaEyebrow"
            component="div"
          >
            Suchen im Archiv
          </Typography>
          <Typography
            variant="displaySearchH1"
            component="h1"
            sx={{ margin: 0, color: eenewsColors.ink }}
          >
            Was möchten Sie wissen?
          </Typography>
          <Typography
            variant="bodyLeadXl"
            component="p"
            sx={{ margin: 0, color: eenewsColors.inkSoft, maxWidth: '64ch' }}
          >
            Volltextsuche über Titel und Inhalt aller veröffentlichten Artikel
            und Seiten.
          </Typography>
        </StageInner>
      </Stage>
      <ResultsWrap>
        <SearchPage {...props} />
      </ResultsWrap>
    </>
  );
}

export const getServerSideProps = SearchPageGetServerSideProps;
