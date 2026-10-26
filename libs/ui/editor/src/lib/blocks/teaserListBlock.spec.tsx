import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType, TeaserType } from '@wepublish/editor/api';

import { TeaserListBlock } from './teaserListBlock';
import { TeaserListBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${Object.values(options).join(',')}` : key,
  }),
}));

vi.mock('../panel/teaserListConfigPanel', () => ({
  TeaserListConfigPanel: () => null,
  useTeaserTypeText: () => (type: string) => type,
}));

const renderBlock = () =>
  render(
    <ThemeProvider theme={theme}>
      <TeaserListBlock
        type={EditorBlockType.TeaserList}
        value={
          {
            title: 'Latest',
            filter: {},
            teasers: [],
            skip: 0,
            take: 6,
            sort: null,
            teaserType: TeaserType.Article,
          } as unknown as TeaserListBlockValue
        }
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('TeaserListBlock', () => {
  it('summarises the list settings in the card header', () => {
    renderBlock();

    expect(
      screen.getByText(`blocks.teaserList.teaserType ${TeaserType.Article}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText('blocks.teaserList.take 6 · blocks.teaserList.skip 0')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'blocks.teaserList.edit' })
    ).toBeInTheDocument();
  });
});
