import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockPoll,
  mockSettingListQuery,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  TeaserSlotBoundary,
  TeaserSlotContext,
} from '@wepublish/puck-content/website';
import { createElement, ReactElement } from 'react';

import { dataComponents } from './data.blocks';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

const article = mockArticle({
  latest: mockArticleRevision({ title: 'Slotted title', blocks: [] }),
});

const inTeaserSlot = (ui: ReactElement) =>
  renderWithProviders(
    <TeaserSlotBoundary
      datasources={{ article: { type: 'slot' } }}
      data={{ ...emptyPuckBlockData, articles: [article] }}
    >
      {ui}
    </TeaserSlotBoundary>
  );

const teaserTitle = (props: Record<string, unknown> = {}) =>
  createElement(dataComponents.TeaserTitle.render, {
    id: 'TeaserTitle-1',
    puck,
    ...props,
  });

describe('dataComponents', () => {
  it('shows the teaser of the surrounding slot in the canvas', () => {
    inTeaserSlot(teaserTitle());

    expect(screen.getByRole('heading', { name: 'Slotted title' })).toBeTruthy();
  });

  it('shows nothing for a teaser block in a slot without a teaser', () => {
    const { container } = renderWithProviders(
      <TeaserSlotContext.Provider value={null}>
        {teaserTitle()}
      </TeaserSlotContext.Provider>
    );

    expect(container.childElementCount).toBe(0);
  });

  it('shows the error of a teaser block outside any teaser slot', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    onTestFinished(() => consoleError.mockRestore());

    renderWithProviders(teaserTitle());

    expect(screen.getByRole('alert').textContent).toContain(
      'useTeaserSlot must be used within'
    );
  });

  it('never hands the envelope to the canvas DOM', () => {
    const { container } = inTeaserSlot(
      teaserTitle({
        locked: true,
        editMode: true,
        visibility: { breakpoints: ['xs'] },
      })
    );
    const heading = screen.getByText('Slotted title');

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(heading);
    expect(heading.getAttributeNames().sort()).toEqual(['class']);
  });

  it('hides a teaser block on the screen sizes it is not shown on', () => {
    inTeaserSlot(teaserTitle({ visibility: { breakpoints: ['xs'] } }));

    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Slotted title').tagName).toBe('H2');
  });

  it('renders the poll of its props through the website poll', () => {
    renderWithProviders(
      createElement(dataComponents.Poll.render, {
        id: 'Poll-1',
        puck,
        poll: mockPoll({ question: 'Coffee or tea?', closedAt: null }),
      }),
      { mocks: [mockSettingListQuery()] }
    );

    expect(
      screen.getByRole('heading', { name: 'Coffee or tea?' })
    ).toBeTruthy();
  });

  it('keeps the placeholder comments of its props', () => {
    const { container } = renderWithProviders(
      createElement(dataComponents.Comment.render, {
        id: 'Comment-1',
        puck,
        comments: [],
      })
    );

    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
  });

  it('renders nothing for a crowdfunding without data', () => {
    const { container } = renderWithProviders(
      createElement(dataComponents.Crowdfunding.render, {
        id: 'Crowdfunding-1',
        puck,
      })
    );

    expect(container.childElementCount).toBe(0);
  });
});
