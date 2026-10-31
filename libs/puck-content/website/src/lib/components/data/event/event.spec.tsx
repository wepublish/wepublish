import { screen } from '@testing-library/react';
import { mockEvent, renderWithProviders } from '@wepublish/mocks/website';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { EventRender } from './event.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const concert = mockEvent({ id: 'concert', name: 'Concert' });
const reading = mockEvent({ id: 'reading', name: 'Reading' });

const renderEvent = (data: PuckBlockData) =>
  renderWithProviders(
    <EventRender
      id="Event-1"
      props={{ blockStyle: null }}
      data={data}
      slots={{}}
      className="styled"
    />
  );

describe('EventRender', () => {
  it('lists the events its datasource yields, in their order', () => {
    renderEvent({ ...emptyPuckBlockData, events: [reading, concert] });

    expect(
      screen.getAllByRole('heading').map(({ textContent }) => textContent)
    ).toEqual(['Reading', 'Concert']);
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderEvent({
      ...emptyPuckBlockData,
      events: [concert],
    });

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.classList).toContain('styled');
  });

  it('lists no events while the block has no event data', () => {
    const { container } = renderEvent(emptyPuckBlockData);

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });
});
