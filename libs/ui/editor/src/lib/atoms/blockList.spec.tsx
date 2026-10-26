import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { MdTitle } from 'react-icons/md';

import { BlockList, BlockListValue } from './blockList';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const theme = createTheme({ cssVariables: true });

type TextBlock = BlockListValue<'text', { text: string; disabled?: boolean }>;

const blockMap = {
  text: {
    label: 'Text',
    icon: <MdTitle />,
    group: 'text' as const,
    defaultValue: { text: '' },
    field: ({ value }: { value: { text: string } }) => (
      <p data-testid="block">{value.text}</p>
    ),
  },
};

function Blocks({
  initial,
  disabled,
}: {
  initial: string[];
  disabled?: boolean;
}) {
  const [values, setValues] = useState<TextBlock[]>(
    initial.map(text => ({ key: text, type: 'text', value: { text } }))
  );

  return (
    <ThemeProvider theme={theme}>
      <BlockList<TextBlock>
        value={values}
        onChange={setValues}
        blockMap={blockMap as never}
        disabled={disabled}
      />
    </ThemeProvider>
  );
}

const order = () =>
  screen.getAllByTestId('block').map(block => block.textContent);

const buttons = (name: string) => screen.getAllByRole('button', { name });

describe('BlockList', () => {
  it('names the style select after its visible label', () => {
    render(<Blocks initial={['a']} />);

    expect(
      screen.getByRole('combobox', { name: /blockStyles.style/ })
    ).toBeInTheDocument();
  });

  it('keeps every block control shut in a read-only list', () => {
    render(
      <Blocks
        initial={['a']}
        disabled
      />
    );

    expect(
      screen.getByRole('button', { name: 'blockList.hideBlock' })
    ).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: /blockStyles.style/ })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps focus on the moved block when it can move further', () => {
    render(<Blocks initial={['a', 'b', 'c']} />);

    const down = buttons('blockList.moveBlockDown')[0];
    down.focus();
    fireEvent.click(down);

    expect(order()).toEqual(['b', 'a', 'c']);
    expect(document.activeElement).toBe(buttons('blockList.moveBlockDown')[1]);
  });

  it('focuses the other move button once the block reaches the end', () => {
    render(<Blocks initial={['a', 'b']} />);

    const down = buttons('blockList.moveBlockDown')[0];
    down.focus();
    fireEvent.click(down);

    expect(order()).toEqual(['b', 'a']);
    expect(document.activeElement).toBe(buttons('blockList.moveBlockUp')[1]);
  });

  it('announces where the block went', () => {
    render(<Blocks initial={['a', 'b', 'c']} />);

    fireEvent.click(buttons('blockList.moveBlockUp')[2]);

    expect(screen.getByRole('status')).toHaveTextContent(
      'blockList.movedTo:{"position":2,"count":3}'
    );
  });

  it('moves focus to the block that takes the place of a deleted one', () => {
    render(<Blocks initial={['a', 'b', 'c']} />);

    fireEvent.click(buttons('blockList.deleteBlock')[1]);

    expect(order()).toEqual(['a', 'c']);
    expect(document.activeElement).toBe(buttons('blockList.deleteBlock')[1]);
    expect(screen.getByRole('status')).toHaveTextContent('blockList.deleted');
  });

  it('announces every deletion, even when the message repeats', async () => {
    render(<Blocks initial={['a', 'b', 'c']} />);

    const status = screen.getByRole('status');
    const changes: string[] = [];
    const observer = new MutationObserver(() =>
      changes.push(status.textContent ?? '')
    );
    observer.observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    fireEvent.click(buttons('blockList.deleteBlock')[0]);
    await Promise.resolve();
    fireEvent.click(buttons('blockList.deleteBlock')[0]);
    await Promise.resolve();
    observer.disconnect();

    expect(order()).toEqual(['c']);
    expect(changes).toEqual(['blockList.deleted', 'blockList.deleted']);
  });

  it('moves focus to the previous block when the last one is deleted', () => {
    render(<Blocks initial={['a', 'b']} />);

    fireEvent.click(buttons('blockList.deleteBlock')[1]);

    expect(document.activeElement).toBe(buttons('blockList.deleteBlock')[0]);
  });

  it('moves focus to the add button when the list becomes empty', () => {
    render(<Blocks initial={['a']} />);

    fireEvent.click(buttons('blockList.deleteBlock')[0]);

    expect(document.activeElement).toBe(buttons('blockList.addBlock')[0]);
  });

  it('labels the style select without the help text', () => {
    render(<Blocks initial={['a']} />);

    const select = screen.getByRole('combobox', { name: /blockStyles.style/ });

    expect(select).not.toHaveAccessibleName(/blockList.styleHelp/);
    expect(within(document.body).getAllByTestId('block')).toHaveLength(1);
  });
});
