import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloLink } from '@apollo/client/link';
import { ApolloProvider } from '@apollo/client/react';
import { act, renderHook } from '@testing-library/react';
import {
  PuckBlockKind,
  PuckBlocksPreviewQueryVariables,
  PuckDatasourceType,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { Observable } from 'rxjs';

import { usePuckBlockDataPreview } from './use-puck-block-data-preview';

type Request = {
  variables: Record<string, unknown>;
  respond: (puckBlocks: { id: string; data: object }[]) => void;
  fail: () => void;
};

const setup = () => {
  const requests: Request[] = [];
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
            fail: () => subscriber.error(new Error('offline')),
          });
        })
    ),
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );

  return { requests, wrapper };
};

const variablesFor = (
  type: PuckDatasourceType
): PuckBlocksPreviewQueryVariables => ({
  puckBlocks: [
    {
      id: 'Grid-1',
      kind: PuckBlockKind.Puck,
      type: 'Grid',
      props: {},
      datasources: { article: { type } },
    },
  ],
  puckRegistry: null,
});

const dataWith = (title: string) => ({
  __typename: 'PuckBlockData',
  articles: [{ __typename: 'Article', id: title, title }],
  pages: null,
  events: null,
  images: null,
  memberPlans: null,
  userSubscriptions: null,
});

const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePuckBlockDataPreview', () => {
  it('asks once the document has not changed for the delay', async () => {
    const { requests, wrapper } = setup();
    const { rerender } = renderHook(
      ({ variables }) => usePuckBlockDataPreview(variables),
      {
        wrapper,
        initialProps: { variables: variablesFor(PuckDatasourceType.List) },
      }
    );

    await wait(200);
    rerender({ variables: variablesFor(PuckDatasourceType.UniqueList) });
    await wait(200);

    expect(requests).toHaveLength(0);

    await wait(100);

    expect(requests).toHaveLength(1);
    expect(requests[0].variables).toEqual(
      variablesFor(PuckDatasourceType.UniqueList)
    );
  });

  it('asks again when the editor comes back to the window, so linked templates edited elsewhere show up', async () => {
    const { requests, wrapper } = setup();

    renderHook(
      () => usePuckBlockDataPreview(variablesFor(PuckDatasourceType.List)),
      {
        wrapper,
      }
    );

    await wait(300);
    expect(requests).toHaveLength(1);

    requests[0].respond([]);
    await flush();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await wait(300);

    expect(requests).toHaveLength(2);
  });

  it('does not ask again for a document that only changed in what the preview ignores', async () => {
    const { requests, wrapper } = setup();
    const { rerender } = renderHook(
      ({ variables }) => usePuckBlockDataPreview(variables),
      {
        wrapper,
        initialProps: { variables: variablesFor(PuckDatasourceType.List) },
      }
    );

    await wait(300);
    rerender({ variables: variablesFor(PuckDatasourceType.List) });
    await wait(300);

    expect(requests).toHaveLength(1);
  });

  it('gives every block the data of the response by its id', async () => {
    const { requests, wrapper } = setup();
    const { result } = renderHook(
      () => usePuckBlockDataPreview(variablesFor(PuckDatasourceType.List)),
      { wrapper }
    );

    expect(result.current.size).toBe(0);

    await wait(300);
    requests[0].respond([
      { id: 'Grid-1', data: dataWith('First') },
      { id: 'Title-2', data: dataWith('Second') },
    ]);
    await flush();

    expect(result.current.get('Grid-1')).toEqual(dataWith('First'));
    expect(result.current.get('Title-2')).toEqual(dataWith('Second'));
    expect(result.current.get('Missing-3')).toBeUndefined();
  });

  it('keeps the previous data while the next request loads and when it fails', async () => {
    const { requests, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ variables }) => usePuckBlockDataPreview(variables),
      {
        wrapper,
        initialProps: { variables: variablesFor(PuckDatasourceType.List) },
      }
    );

    await wait(300);
    requests[0].respond([{ id: 'Grid-1', data: dataWith('First') }]);
    await flush();

    rerender({ variables: variablesFor(PuckDatasourceType.UniqueList) });
    await wait(300);

    expect(requests).toHaveLength(2);
    expect(result.current.get('Grid-1')).toEqual(dataWith('First'));

    requests[1].fail();
    await flush();

    expect(result.current.get('Grid-1')).toEqual(dataWith('First'));
  });

  it('ignores a response that arrives after a newer request was sent', async () => {
    const { requests, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ variables }) => usePuckBlockDataPreview(variables),
      {
        wrapper,
        initialProps: { variables: variablesFor(PuckDatasourceType.List) },
      }
    );

    await wait(300);
    rerender({ variables: variablesFor(PuckDatasourceType.UniqueList) });
    await wait(300);

    requests[1].respond([{ id: 'Grid-1', data: dataWith('Newer') }]);
    await flush();
    requests[0].respond([{ id: 'Grid-1', data: dataWith('Older') }]);
    await flush();

    expect(result.current.get('Grid-1')).toEqual(dataWith('Newer'));
  });

  it('asks nothing and has no data without anything to preview', async () => {
    const { requests, wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ variables }) => usePuckBlockDataPreview(variables),
      {
        wrapper,
        initialProps: {
          variables: variablesFor(
            PuckDatasourceType.List
          ) as PuckBlocksPreviewQueryVariables | null,
        },
      }
    );

    await wait(300);
    requests[0].respond([{ id: 'Grid-1', data: dataWith('First') }]);
    await flush();

    rerender({ variables: null });
    await wait(300);

    expect(requests).toHaveLength(1);
    expect(result.current.size).toBe(0);
  });
});
