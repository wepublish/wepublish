import '@testing-library/jest-dom/vitest';

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloLink, execute } from '@apollo/client/link';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { queryErrorLink } from '@wepublish/editor/api';
import { gql } from 'graphql-tag';
import { Observable } from 'rxjs';

import { humanizeError } from './humanizeError';
import { SnackbarHost } from './snackbar';
import { useReportQueryErrors } from './useReportQueryErrors';

const theme = createTheme({ cssVariables: true });

const failure = new Error('kaputt');

const failing = new ApolloLink(
  () => new Observable(subscriber => subscriber.error(failure))
);

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.empty(),
});

const aQuery = gql`
  query Users {
    users {
      id
    }
  }
`;

function Reporter() {
  useReportQueryErrors();

  return <SnackbarHost />;
}

const runFailingQuery = () =>
  new Promise<void>(resolve => {
    execute(
      ApolloLink.from([queryErrorLink, failing]),
      { query: aQuery },
      {
        client,
      }
    ).subscribe({ error: () => resolve(), complete: () => resolve() });
  });

describe('useReportQueryErrors', () => {
  it('shows what a failed query means, without the view asking', async () => {
    render(
      <ThemeProvider theme={theme}>
        <Reporter />
      </ThemeProvider>
    );

    await runFailingQuery();

    expect(await screen.findByText(humanizeError(failure))).toBeInTheDocument();
  });
});
