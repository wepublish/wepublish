import '@testing-library/jest-dom/vitest';

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloLink } from '@apollo/client/link';
import { ApolloProvider } from '@apollo/client/react';
import { AppState, Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { Observable } from 'rxjs';

import { usePuckBlockData } from './puck-block-data.context';
import { puckBlockDataPlugin } from './puck-block-data.plugin';

type Request = {
  variables: Record<string, unknown>;
  respond: (puckBlocks: { id: string; data: object }[]) => void;
};

const usePuck = createUsePuck();

const config: Config = {
  components: {
    Grid: {
      fields: { content: { type: 'slot' } },
      render: () => <div />,
    },
    TeaserTitle: { render: () => <p /> },
  },
};

const documentWith = (datasources: object | undefined): Data => ({
  root: { props: {} },
  content: [
    {
      type: 'Grid',
      props: {
        id: 'Grid-1',
        datasources,
        content: [{ type: 'TeaserTitle', props: { id: 'TeaserTitle-2' } }],
      },
    },
  ],
});

const blockData = (articleIds: string[]) => ({
  __typename: 'PuckBlockData',
  articles: articleIds.map(id => ({ __typename: 'Article', id })),
  pages: null,
  events: null,
  images: null,
  memberPlans: null,
  userSubscriptions: null,
});

const appStates: AppState[] = [];

function Probe() {
  const grid = usePuckBlockData('Grid-1');
  const missing = usePuckBlockData('Missing-9');
  const appState = usePuck(puck => puck.appState);

  useEffect(() => {
    appStates.push(appState);
  }, [appState]);

  return (
    <>
      <output aria-label="Grid">
        {grid.articles?.map(({ id }) => id).join(', ') ?? 'No data'}
      </output>
      <output aria-label="Missing">
        {missing.articles === null ? 'No data' : 'Data'}
      </output>
    </>
  );
}

const renderEditor = (data: Data) => {
  const requests: Request[] = [];
  const onChange = vi.fn();
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      operation =>
        new Observable(subscriber => {
          requests.push({
            variables: operation.variables,
            respond: puckBlocks => {
              subscriber.next({
                data: {
                  puckBlocksPreview: {
                    __typename: 'PuckBlocksPreview',
                    puckBlocks,
                    puckRegistry: null,
                  },
                },
              });
              subscriber.complete();
            },
          });
        })
    ),
  });

  render(
    <ApolloProvider client={client}>
      <Puck
        config={config}
        data={data}
        plugins={[puckBlockDataPlugin]}
        onChange={onChange}
      >
        <Probe />
      </Puck>
    </ApolloProvider>
  );

  return { requests, onChange };
};

const output = (name: string) => screen.getByRole('status', { name });

beforeEach(() => {
  appStates.length = 0;
});

describe('puckBlockDataPlugin', () => {
  it('asks the API for the data of the blocks and hands it to them by id', async () => {
    const { requests } = renderEditor(
      documentWith({ article: { type: 'list' } })
    );

    await waitFor(() => expect(requests).toHaveLength(1));

    expect(requests[0].variables).toEqual({
      puckBlocks: [
        {
          id: 'Grid-1',
          kind: 'puck',
          type: 'Grid',
          props: {},
          datasources: { article: { type: 'list' } },
          children: [
            {
              id: 'TeaserTitle-2',
              kind: 'puck',
              type: 'TeaserTitle',
              props: {},
            },
          ],
        },
      ],
      puckRegistry: null,
    });
    expect(output('Grid')).toHaveTextContent('No data');

    act(() =>
      requests[0].respond([
        { id: 'Grid-1', data: blockData(['First', 'Second']) },
      ])
    );

    expect(await screen.findByText('First, Second')).toBeInTheDocument();
    expect(output('Missing')).toHaveTextContent('No data');
  });

  it('never touches the document Puck holds when the data arrives', async () => {
    const { requests, onChange } = renderEditor(
      documentWith({ article: { type: 'list' } })
    );

    await waitFor(() => expect(requests).toHaveLength(1));

    const changesBefore = onChange.mock.calls.length;
    const stateBefore = appStates.at(-1);

    act(() =>
      requests[0].respond([{ id: 'Grid-1', data: blockData(['First']) }])
    );

    expect(await screen.findByText('First')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(changesBefore);
    expect(appStates.at(-1)).toBe(stateBefore);
  });

  it('asks nothing for a document without datasources', async () => {
    const { requests } = renderEditor(documentWith(undefined));

    await act(() => new Promise(resolve => setTimeout(resolve, 400)));

    expect(requests).toHaveLength(0);
    expect(output('Grid')).toHaveTextContent('No data');
  });
});
