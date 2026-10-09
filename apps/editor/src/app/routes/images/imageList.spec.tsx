import { useQuery } from '@apollo/client/react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ImageList } from './imageList';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { images: { nodes: [], totalCount: 0 } },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('ImageList', () => {
  it('loads enough images to fill the page by default', () => {
    render(
      <MemoryRouter initialEntries={['/images']}>
        <ImageList />
      </MemoryRouter>
    );

    expect(lastVariables()).toEqual(expect.objectContaining({ take: 50 }));
  });
});
