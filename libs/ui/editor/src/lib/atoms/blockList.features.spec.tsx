import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MdTitle } from 'react-icons/md';

import { BlockList, BlockListValue } from './blockList';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const features = vi.hoisted(() => ({
  enabled: undefined as ReadonlySet<string> | undefined,
}));

vi.mock('../featureContext', () => ({
  useFeatures: () => features.enabled,
}));

const theme = createTheme({ cssVariables: true });

type TextBlock = BlockListValue<'text' | 'gift', { text: string }>;

const field = ({ value }: { value: { text: string } }) => <p>{value.text}</p>;

const blockMap = {
  text: {
    label: 'Text',
    icon: <MdTitle />,
    group: 'text' as const,
    defaultValue: { text: '' },
    field,
  },
  gift: {
    label: 'Gift',
    icon: <MdTitle />,
    group: 'interaction' as const,
    feature: 'gift-codes' as const,
    defaultValue: { text: '' },
    field,
  },
};

const openAddMenu = () => {
  render(
    <ThemeProvider theme={theme}>
      <BlockList<TextBlock>
        value={[]}
        onChange={vi.fn()}
        blockMap={blockMap as never}
      />
    </ThemeProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: 'blockList.addBlock' }));
};

describe('BlockList feature-gated blocks', () => {
  it('offers a feature-gated block when the feature is on', () => {
    features.enabled = new Set(['gift-codes']);
    openAddMenu();

    expect(screen.getByRole('menuitem', { name: 'Gift' })).toBeInTheDocument();
  });

  it('hides a feature-gated block when the feature is off', () => {
    features.enabled = new Set();
    openAddMenu();

    expect(screen.getByRole('menuitem', { name: 'Text' })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Gift' })
    ).not.toBeInTheDocument();
  });

  it('hides a feature-gated block until the features are known', () => {
    features.enabled = undefined;
    openAddMenu();

    expect(
      screen.queryByRole('menuitem', { name: 'Gift' })
    ).not.toBeInTheDocument();
  });
});
