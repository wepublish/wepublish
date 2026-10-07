import { fireEvent, render, screen } from '@testing-library/react';

import { InfoTooltip, InfoTrigger } from './infoTooltip';

describe('InfoTooltip', () => {
  it('explains itself when it gets focus', async () => {
    render(<InfoTooltip text="Applies to new articles only." />);

    fireEvent.focus(
      screen.getByRole('button', { name: 'Applies to new articles only.' })
    );

    expect((await screen.findByRole('tooltip')).textContent).toContain(
      'Applies to new articles only.'
    );
  });

  it('can be named separately from a longer explanation', () => {
    render(
      <InfoTooltip
        label="What is this?"
        text={<p>A longer explanation.</p>}
      />
    );

    expect(screen.getByRole('button', { name: 'What is this?' })).toBeTruthy();
  });
});

describe('InfoTrigger', () => {
  it('never submits the form it sits in', () => {
    const onSubmit = vi.fn(event => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <InfoTrigger aria-label="Info" />
      </form>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
