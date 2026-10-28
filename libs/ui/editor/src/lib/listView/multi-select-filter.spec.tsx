import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { MultiSelectFilter } from './multi-select-filter';

const theme = createTheme({ cssVariables: true });

const options = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'published', label: 'Published' },
];

type Props = Parameters<typeof MultiSelectFilter>[0];

const renderFilter = (props: Partial<Props> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <MultiSelectFilter
        options={options}
        value={[]}
        onChange={() => undefined}
        placeholder="States"
        {...props}
      />
    </ThemeProvider>
  );

const openListbox = () => {
  fireEvent.mouseDown(screen.getByRole('combobox'));

  return screen.getByRole('listbox');
};

describe('MultiSelectFilter', () => {
  it('shows the placeholder while nothing is selected', () => {
    renderFilter();

    expect(screen.getByPlaceholderText('States')).toBeInTheDocument();
  });

  it('renders the selected values as tags', () => {
    renderFilter({ value: ['draft', 'published'] });

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('adds a value when an option is picked', () => {
    const onChange = vi.fn();
    renderFilter({ value: ['draft'], onChange });

    fireEvent.click(within(openListbox()).getByText('Pending'));

    expect(onChange).toHaveBeenCalledWith(['draft', 'pending']);
  });

  it('removes a value when its option is picked again', () => {
    const onChange = vi.fn();
    renderFilter({ value: ['draft', 'pending'], onChange });

    fireEvent.click(within(openListbox()).getByText('Draft'));

    expect(onChange).toHaveBeenCalledWith(['pending']);
  });

  it('keeps the options in the order they were given, not the order they were picked', () => {
    const onChange = vi.fn();
    renderFilter({ value: ['published'], onChange });

    fireEvent.click(within(openListbox()).getByText('Draft'));

    expect(onChange).toHaveBeenCalledWith(['draft', 'published']);
  });

  it('explains an option that carries a hint, without explaining the others', () => {
    renderFilter({
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending', hint: 'Waiting to go live' },
      ],
    });

    expect(
      within(openListbox()).getByRole('button', {
        name: 'Waiting to go live',
      })
    ).toBeInTheDocument();
  });

  it('hides the placeholder once a value is selected', () => {
    renderFilter({ value: ['draft'] });

    expect(screen.queryByPlaceholderText('States')).not.toBeInTheDocument();
  });
});

describe('MultiSelectFilter colours', () => {
  const coloured = [
    {
      value: 'draft',
      label: 'Draft',
      chipSx: { backgroundColor: 'rgb(248, 239, 222)' },
    },
    { value: 'published', label: 'Published' },
  ];

  it('paints a chip with the colour its option carries', () => {
    render(
      <ThemeProvider theme={theme}>
        <MultiSelectFilter
          options={coloured}
          value={['draft']}
          onChange={() => undefined}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Draft').closest('.MuiChip-root')).toHaveStyle({
      backgroundColor: 'rgb(248, 239, 222)',
    });
  });

  it('leaves a chip without a colour alone', () => {
    render(
      <ThemeProvider theme={theme}>
        <MultiSelectFilter
          options={coloured}
          value={['published']}
          onChange={() => undefined}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByText('Published').closest('.MuiChip-root')
    ).not.toHaveStyle({ backgroundColor: 'rgb(248, 239, 222)' });
  });
});
