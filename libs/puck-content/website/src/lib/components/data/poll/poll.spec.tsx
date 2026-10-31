import { screen } from '@testing-library/react';
import {
  mockPoll,
  mockSettingListQuery,
  renderWithProviders,
} from '@wepublish/mocks/website';
import type { BuilderPollBlockProps } from '@wepublish/website/builder';

import { emptyPuckBlockData } from '../../../blocks/block.types';
import { PollRender } from './poll.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const renderPoll = (props: BuilderPollBlockProps) =>
  renderWithProviders(
    <PollRender
      id="Poll-1"
      props={props}
      data={emptyPuckBlockData}
      slots={{}}
      className="styled"
    />,
    { mocks: [mockSettingListQuery()] }
  );

describe('PollRender', () => {
  it('shows the poll of its props on a root carrying the class name', () => {
    const { container } = renderPoll({
      poll: mockPoll({ question: 'Coffee or tea?', closedAt: null }),
    });

    expect(
      screen.getByRole('heading', { name: 'Coffee or tea?' })
    ).toBeTruthy();
    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.classList).toContain('styled');
  });

  it('renders nothing without a poll', () => {
    const { container } = renderPoll({});

    expect(container.childElementCount).toBe(0);
  });
});
