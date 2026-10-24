import { fireEvent, render, screen } from '@testing-library/react';

import { renderWith } from '../event-list/test-helpers';
import { PublishEventDialog } from './publish-event-dialog';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

const NOW = new Date('2026-10-23T08:00:00.000Z');

const renderDialog = () => {
  const onConfirm = vi.fn();

  render(
    renderWith(
      <PublishEventDialog
        open
        now={NOW}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )
  );

  return onConfirm;
};

const chooseLater = () =>
  fireEvent.click(
    screen.getByRole('radio', { name: 'agenda.editor.publish.later' })
  );

const publishAt = () =>
  screen.getByLabelText('agenda.editor.publish.at', { selector: 'input' });

const confirm = () =>
  screen.getByRole('button', { name: 'agenda.editor.publish.confirm' });

describe('PublishEventDialog', () => {
  it('publishes now by sending no publication date', () => {
    const onConfirm = renderDialog();

    fireEvent.click(confirm());

    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('sends the chosen moment, read as Swiss time', () => {
    const onConfirm = renderDialog();

    chooseLater();
    fireEvent.change(publishAt(), { target: { value: '2026-12-01T09:30' } });
    fireEvent.click(confirm());

    expect(onConfirm).toHaveBeenCalledWith(
      new Date('2026-12-01T08:30:00.000Z')
    );
  });

  it('refuses a moment in the past and says why', () => {
    const onConfirm = renderDialog();

    chooseLater();
    fireEvent.change(publishAt(), { target: { value: '2026-10-22T09:30' } });

    expect(
      screen.getByText('agenda.editor.publish.inThePast')
    ).toBeInTheDocument();
    expect(confirm()).toBeDisabled();

    fireEvent.click(confirm());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('asks for a moment before publishing later', () => {
    renderDialog();

    chooseLater();

    expect(confirm()).toBeDisabled();
  });
});
