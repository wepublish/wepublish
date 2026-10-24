import { useApolloClient, useQuery } from '@apollo/client/react';
import { fireEvent, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { renderInForm } from '../test-helpers';
import {
  EventMetadataPanel,
  EventMetadataPanelProps,
} from './event-metadata-panel';
import { testEvent } from './test-event';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useApolloClient: vi.fn(),
}));

beforeEach(() => {
  (useQuery as unknown as Mock).mockReturnValue({
    data: undefined,
    loading: false,
    refetch: vi.fn(),
  });
  (useApolloClient as unknown as Mock).mockReturnValue({
    query: vi.fn().mockResolvedValue({ data: {} }),
  });
});

const renderPanel = (props: Partial<EventMetadataPanelProps> = {}) => {
  const handlers = {
    onTabChange: vi.fn(),
    onSave: vi.fn(),
    onSaveAndClose: vi.fn(),
    onClose: vi.fn(),
  };

  renderInForm(
    <EventMetadataPanel
      tab="general"
      event={testEvent()}
      now={new Date('2026-10-23T08:00:00.000Z')}
      readOnly={false}
      busy={false}
      {...handlers}
      {...props}
    />
  );

  return handlers;
};

describe('EventMetadataPanel', () => {
  it('saves from the drawer as the article drawer does', () => {
    const { onSave, onSaveAndClose } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    fireEvent.click(screen.getByRole('button', { name: 'saveAndClose' }));

    expect(onSave).toHaveBeenCalled();
    expect(onSaveAndClose).toHaveBeenCalled();
  });

  it('opens the option lists inside the drawer, so they stay in the modal dialog', () => {
    renderPanel();

    const venue = screen.getByRole('combobox', { name: 'agenda.form.place' });
    fireEvent.mouseDown(venue);
    fireEvent.keyDown(venue, { key: 'ArrowDown' });

    const popper = document.querySelector('.MuiAutocomplete-popper');

    expect(popper).not.toBeNull();
    expect(screen.getByRole('tablist').closest('form')).toContainElement(
      popper as HTMLElement
    );
  });

  it('switches tabs through the caller, which keeps the tab in the address', () => {
    const { onTabChange } = renderPanel();

    fireEvent.click(
      screen.getByRole('tab', { name: 'agenda.editor.tabs.pricing' })
    );

    expect(onTabChange).toHaveBeenCalledWith('pricing');
  });

  it('offers only Close and locks the fields of a read-only event', () => {
    const { onClose } = renderPanel({ readOnly: true });

    expect(screen.queryByRole('button', { name: 'save' })).toBeNull();
    expect(
      screen.getByRole('textbox', { name: 'agenda.editor.printDescription' })
    ).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('puts a save problem where the open drawer shows it', () => {
    renderPanel({ notice: <div role="alert">Not saved</div> });

    expect(screen.getByRole('alert')).toHaveTextContent('Not saved');
  });
});
