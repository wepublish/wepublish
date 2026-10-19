import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { BlockStylesDocument, EditorBlockType } from '@wepublish/editor/api';
import { useState } from 'react';

import { BlockMap } from '../blocks/blockMap';
import { BlockValue } from '../blocks/types';
import { BlockList } from './blockList';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const blockStylesMock = [
  {
    request: { query: BlockStylesDocument, variables: {} },
    result: { data: { blockStyles: [] } },
  },
];

const titleBlockValue = (): BlockValue => ({
  key: 'title-block',
  type: EditorBlockType.Title,
  value: { title: 'Title', preTitle: '', lead: '' },
});

const Harness = ({ onValue }: { onValue: (value: BlockValue[]) => void }) => {
  const [value, setValue] = useState<BlockValue[]>([titleBlockValue()]);

  return (
    <ThemeProvider theme={theme}>
      <MockedProvider mocks={blockStylesMock}>
        <BlockList
          value={value}
          onChange={update => {
            const next =
              typeof update === 'function' ? update(value) : (update as never);
            setValue(next);
            onValue(next);
          }}
          blockMap={BlockMap}
        />
      </MockedProvider>
    </ThemeProvider>
  );
};

describe('BlockList timing', () => {
  it('offers to time every block', () => {
    render(<Harness onValue={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'blockList.timeBlock' })
    ).toBeInTheDocument();
  });

  it('keeps the window a reader sets on the block', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'blockList.timeBlock' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'weekday.Monday' }));

    expect(onValue).toHaveBeenCalledWith([
      expect.objectContaining({
        value: expect.objectContaining({
          timing: { weekdays: ['Monday'] },
        }),
      }),
    ]);
  });
});
