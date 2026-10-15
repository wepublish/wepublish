import { fireEvent, render, screen } from '@testing-library/react';
import type { Data } from '@puckeditor/core';
import { SettingsContext, SettingsSection, snapshotOf } from './settings';

const data = (preheader: string) =>
  ({ root: { props: { preheader } }, content: [] }) as unknown as Data;

const dispatch = vi.fn();

vi.mock('@puckeditor/core', () => ({
  usePuck: () => ({ appState: { data: data('Vorschau') }, dispatch }),
}));

const renderSection = (setTitle = vi.fn()) =>
  render(
    <SettingsContext.Provider value={{ title: 'Ausgabe 1', setTitle }}>
      <SettingsSection />
    </SettingsContext.Provider>
  );

describe('SettingsSection', () => {
  it('edits the title of the issue', () => {
    const setTitle = vi.fn();

    renderSection(setTitle);

    const input = screen.getByLabelText('newsletter.settings.title');

    expect((input as HTMLInputElement).value).toBe('Ausgabe 1');

    fireEvent.change(input, { target: { value: 'Ausgabe 2' } });

    expect(setTitle).toHaveBeenCalledWith('Ausgabe 2');
  });

  it('edits the preview text in the document, through Puck', () => {
    renderSection();

    const input = screen.getByLabelText('newsletter.blocks.preheader');

    expect((input as HTMLInputElement).value).toBe('Vorschau');

    fireEvent.change(input, { target: { value: 'Neu' } });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'replaceRoot',
      root: { props: { preheader: 'Neu' } },
    });
  });
});

describe('snapshotOf', () => {
  it('changes with the title, so a renamed issue counts as unsaved', () => {
    expect(snapshotOf('Ausgabe 1', data(''))).not.toBe(
      snapshotOf('Ausgabe 2', data(''))
    );
  });

  it('changes with the document', () => {
    expect(snapshotOf('Ausgabe 1', data('a'))).not.toBe(
      snapshotOf('Ausgabe 1', data('b'))
    );
  });

  it('ignores whitespace around the title, as the server does', () => {
    expect(snapshotOf(' Ausgabe 1 ', data(''))).toBe(
      snapshotOf('Ausgabe 1', data(''))
    );
  });
});
