import { fireEvent, render, screen } from '@testing-library/react';
import { EditorEventFragment } from '@wepublish/editor/api';

import { renderWith } from '../event-list/test-helpers';
import {
  EventPublicationControl,
  EventPublicationControlProps,
} from './event-publication-control';
import { testEvent } from './test-event';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

const NOW = new Date('2026-10-23T08:00:00.000Z');

const ORGANISER: EditorEventFragment['viewerCan'] = {
  __typename: 'EventViewerPermissions',
  update: true,
  publish: false,
  delete: false,
  duplicate: true,
  requestReview: true,
  withdrawReview: false,
  moveOrganization: false,
  reassignOwner: false,
};

const handlers = () => ({
  onPublish: vi.fn(),
  onUnpublish: vi.fn(),
  onRequestReview: vi.fn(),
  onWithdrawReview: vi.fn(),
});

const ui = (
  event: EditorEventFragment,
  props: Partial<EventPublicationControlProps> = {}
) =>
  renderWith(
    <EventPublicationControl
      event={event}
      now={NOW}
      disabled={false}
      {...handlers()}
      {...props}
    />
  );

const button = (name: string) => screen.queryByRole('button', { name });

describe('EventPublicationControl', () => {
  it('renders nothing while the permissions are unknown', () => {
    const { container } = render(ui(testEvent({ viewerCan: null })));

    expect(container.querySelector('button')).toBeNull();
    expect(button('agenda.editor.review.request')).toBeNull();
    expect(button('agenda.editor.publish.button')).toBeNull();
  });

  it('offers Publish, which asks when, to someone who may publish', () => {
    const onPublish = vi.fn();
    render(ui(testEvent(), { onPublish }));

    expect(button('agenda.editor.review.request')).toBeNull();
    expect(button('agenda.editor.unpublish.button')).toBeNull();

    fireEvent.click(button('agenda.editor.publish.button')!);
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.publish.confirm' })
    );

    expect(onPublish).toHaveBeenCalledWith(null);
  });

  it('keeps Publish disabled while there is nothing new to publish', () => {
    const published = testEvent({
      draft: null,
      published: {
        __typename: 'EventRevision',
        id: 'rev-0',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
    });
    const { rerender } = render(ui(published));
    const publish = button('agenda.editor.publish.button')!;

    expect(publish).toHaveAttribute('aria-disabled', 'true');
    expect(publish).toHaveAccessibleDescription(
      'agenda.editor.publish.nothingNew'
    );
    expect(publish).not.toBeDisabled();

    fireEvent.click(publish);

    expect(button('agenda.editor.publish.confirm')).toBeNull();

    rerender(ui(published, { hasChanges: true }));

    expect(button('agenda.editor.publish.button')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(
      button('agenda.editor.publish.button')
    ).not.toHaveAccessibleDescription();
  });

  it('says why Ready for review is unavailable while there is nothing new to review', () => {
    const onRequestReview = vi.fn();
    const unchanged = testEvent({
      draft: null,
      published: {
        __typename: 'EventRevision',
        id: 'rev-0',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
      viewerCan: { ...ORGANISER, requestReview: false },
    });
    const { rerender } = render(ui(unchanged, { onRequestReview }));
    const review = button('agenda.editor.review.request')!;

    expect(review).toHaveAttribute('aria-disabled', 'true');
    expect(review).toHaveAccessibleDescription(
      'agenda.editor.review.nothingNew'
    );

    fireEvent.click(review);

    expect(button('agenda.editor.review.confirm')).toBeNull();
    expect(onRequestReview).not.toHaveBeenCalled();

    rerender(ui(unchanged, { onRequestReview, hasChanges: true }));

    expect(button('agenda.editor.review.request')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('offers no review button to someone who may not change the event', () => {
    render(
      ui(
        testEvent({
          viewerCan: { ...ORGANISER, update: false, requestReview: false },
        })
      )
    );

    expect(button('agenda.editor.review.request')).toBeNull();
  });

  it('offers Unpublish once the event is published', () => {
    const onUnpublish = vi.fn();
    render(
      ui(
        testEvent({
          published: {
            __typename: 'EventRevision',
            id: 'rev-0',
            publishedAt: '2026-10-01T00:00:00.000Z',
          },
        }),
        { onUnpublish }
      )
    );

    fireEvent.click(button('agenda.editor.unpublish.button')!);
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.unpublish.confirm' })
    );

    expect(onUnpublish).toHaveBeenCalled();
  });

  it('offers Ready for review instead, naming the organisation that can publish', () => {
    const onRequestReview = vi.fn();
    render(ui(testEvent({ viewerCan: ORGANISER }), { onRequestReview }));

    expect(button('agenda.editor.publish.button')).toBeNull();

    fireEvent.click(button('agenda.editor.review.request')!);

    expect(
      screen.getByText('agenda.editor.review.confirmBody Equilibre')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.review.confirm' })
    );

    expect(onRequestReview).toHaveBeenCalled();
  });

  it('names the agenda team when the event has no organisation', () => {
    render(ui(testEvent({ viewerCan: ORGANISER, organization: null })));

    fireEvent.click(button('agenda.editor.review.request')!);

    expect(
      screen.getByText('agenda.editor.review.confirmBodyAgendaTeam')
    ).toBeInTheDocument();
  });

  it('turns into Withdraw request once review was requested, and announces it', () => {
    const onWithdrawReview = vi.fn();
    const { rerender } = render(ui(testEvent({ viewerCan: ORGANISER })));

    expect(screen.getByRole('status')).toHaveTextContent(
      'agenda.publication.draft'
    );

    rerender(
      ui(
        testEvent({
          reviewRequestedAt: '2026-10-21T08:00:00.000Z',
          viewerCan: {
            ...ORGANISER,
            requestReview: false,
            withdrawReview: true,
          },
        }),
        { onWithdrawReview }
      )
    );

    expect(button('agenda.editor.review.request')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      /agenda\.publication\.reviewRequestedAgo .*2 days ago/
    );

    fireEvent.click(button('agenda.editor.review.withdraw')!);

    expect(onWithdrawReview).toHaveBeenCalled();
  });
});
