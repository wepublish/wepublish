import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  BannerActionRole,
  CreateBannerActionInput,
} from '@wepublish/editor/api';
import { useState } from 'react';

import { BannerActionList } from './banner-action-list';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.number ? `${key} ${options.number}` : key,
  }),
}));

const actions: CreateBannerActionInput[] = [
  {
    label: 'Subscribe',
    url: '/abo',
    style: '',
    role: BannerActionRole.Primary,
  },
  { label: 'Later', url: '', style: '', role: BannerActionRole.Cancel },
];

const StatefulList = () => {
  const [items, setItems] = useState(actions);

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <BannerActionList
        actions={items}
        onAdd={action => setItems(current => [...current, action])}
        onRemove={index =>
          setItems(current => current.filter((_, i) => i !== index))
        }
        onUpdate={vi.fn()}
      />
    </ThemeProvider>
  );
};

const press = (element: HTMLElement) => {
  element.focus();
  fireEvent.click(element);
};

const deleteButtons = () =>
  screen.queryAllByRole('button', { name: 'banner.list.delete' });

describe('BannerActionList', () => {
  it('labels every field of every action', () => {
    render(<StatefulList />);

    const first = screen.getByRole('group', {
      name: 'banner.form.action.group 1',
    });

    expect(
      within(first).getByRole('textbox', { name: 'banner.form.action.label' })
    ).toHaveValue('Subscribe');
    expect(
      within(first).getByRole('textbox', { name: 'banner.form.action.url' })
    ).toBeTruthy();
    expect(
      within(first).getByRole('textbox', { name: 'banner.form.action.style' })
    ).toBeTruthy();
    expect(
      within(first).getByRole('combobox', { name: 'banner.form.action.role' })
    ).toBeTruthy();
  });

  it('moves focus to the next action after deleting one', () => {
    render(<StatefulList />);

    expect(deleteButtons()[0]).not.toHaveFocus();
    fireEvent.click(deleteButtons()[0]);

    expect(deleteButtons()).toHaveLength(1);
    expect(deleteButtons()[0]).toHaveFocus();
  });

  it('falls back to the add button when the last action is deleted', () => {
    render(<StatefulList />);

    press(deleteButtons()[1]);
    expect(deleteButtons()[0]).toHaveFocus();

    press(deleteButtons()[0]);
    expect(
      screen.getByRole('button', { name: 'banner.actions.add' })
    ).toHaveFocus();
  });

  it('focuses the label of a newly added action', () => {
    render(<StatefulList />);

    press(screen.getByRole('button', { name: 'banner.actions.add' }));

    const third = screen.getByRole('group', {
      name: 'banner.form.action.group 3',
    });
    expect(
      within(third).getByRole('textbox', { name: 'banner.form.action.label' })
    ).toHaveFocus();
  });
});
