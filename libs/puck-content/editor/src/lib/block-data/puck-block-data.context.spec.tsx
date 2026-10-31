import { renderHook } from '@testing-library/react';
import { mockArticle } from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/puck-content/website';
import { PropsWithChildren } from 'react';

import {
  PuckBlockDataContext,
  usePuckBlockData,
} from './puck-block-data.context';

const data: PuckBlockData = {
  ...emptyPuckBlockData,
  articles: [mockArticle()],
};

const withData = ({ children }: PropsWithChildren) => (
  <PuckBlockDataContext.Provider value={new Map([['Grid-1', data]])}>
    {children}
  </PuckBlockDataContext.Provider>
);

describe('usePuckBlockData', () => {
  it('reads the data of a block by its id', () => {
    const { result } = renderHook(() => usePuckBlockData('Grid-1'), {
      wrapper: withData,
    });

    expect(result.current).toBe(data);
  });

  it('has empty data for blocks the preview does not know', () => {
    const { result } = renderHook(() => usePuckBlockData('Unknown-1'), {
      wrapper: withData,
    });

    expect(result.current).toBe(emptyPuckBlockData);
  });

  it('has empty data without a preview', () => {
    const { result } = renderHook(() => usePuckBlockData('Grid-1'));

    expect(result.current).toBe(emptyPuckBlockData);
  });
});
