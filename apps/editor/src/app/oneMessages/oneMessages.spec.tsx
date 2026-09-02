import type { Mock } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { OneMessages } from './oneMessages';
import { useOneMessages } from './oneMessages.hooks';
import type { OneMessage } from './oneMessages.types';

vi.mock('./oneMessages.hooks', () => ({
  useOneMessages: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseOneMessages = useOneMessages as Mock;

const message = (overrides: Partial<OneMessage> = {}): OneMessage => ({
  id: 1,
  severity: 'info',
  title: 'Title',
  body: null,
  link_label: null,
  link_url: null,
  dismissible: false,
  starts_at: null,
  ends_at: null,
  ...overrides,
});

const renderWith = (
  messages: OneMessage[],
  props: Parameters<typeof OneMessages>[0] = {}
) => {
  mockedUseOneMessages.mockReturnValue(messages);
  return render(<OneMessages {...props} />);
};

it('renders nothing when there are no messages', () => {
  const { container } = renderWith([]);

  expect(container.firstChild).toBeNull();
});

it('renders the empty message when provided and there are no messages', () => {
  renderWith([], { emptyMessage: 'nothing here' });

  expect(screen.getByText('nothing here')).toBeTruthy();
});

it('renders the We.Publish team header above the messages', () => {
  renderWith([message()]);

  expect(screen.getByText('oneMessages.header')).toBeTruthy();
});

it('hides the header when hideHeader is set', () => {
  renderWith([message()], { hideHeader: true });

  expect(screen.queryByText('oneMessages.header')).toBeNull();
});

it('renders the title and the body', () => {
  renderWith([message({ title: 'Outage', body: 'Line one\nLine two' })]);

  expect(screen.getByText('Outage')).toBeTruthy();
  expect(screen.getByText(/Line one/)).toBeTruthy();
});

it('renders only the title when body is null', () => {
  const { container } = renderWith([message({ title: 'Just a title' })]);

  expect(screen.getByText('Just a title')).toBeTruthy();
  expect(container.querySelector('p')).toBeNull();
});

it('maps critical severity to the rsuite error style', () => {
  const { container } = renderWith([message({ severity: 'critical' })]);

  expect(container.querySelector('.rs-message-error')).toBeTruthy();
});

it('renders a link opening in a new tab using link_label', () => {
  renderWith([
    message({ link_url: 'https://status.wepublish.ch', link_label: 'Status' }),
  ]);

  const link = screen.getByRole('link', { name: 'Status' });
  expect(link.getAttribute('href')).toBe('https://status.wepublish.ch');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
});

it('falls back to the generic link label when link_label is null', () => {
  renderWith([message({ link_url: 'https://status.wepublish.ch' })]);

  expect(
    screen.getByRole('link', { name: 'oneMessages.linkFallback' })
  ).toBeTruthy();
});

it('renders the source tag when provided', () => {
  renderWith([message()], { sourceTag: 'We.Publish Team' });

  expect(screen.getByText('We.Publish Team')).toBeTruthy();
});

it('hides messages that were already read', () => {
  renderWith(
    [
      message({ id: 1, title: 'Read one' }),
      message({ id: 2, title: 'Unread' }),
    ],
    { readItemIds: new Set(['1']), onMarkRead: vi.fn() }
  );

  expect(screen.queryByText('Read one')).toBeNull();
  expect(screen.getByText('Unread')).toBeTruthy();
});

it('renders the empty message when every message was read', () => {
  renderWith([message({ id: 1 })], {
    readItemIds: new Set(['1']),
    emptyMessage: 'all read',
  });

  expect(screen.getByText('all read')).toBeTruthy();
});

it('marks a dismissible message as read when its mark-as-read button is clicked', () => {
  const onMarkRead = vi.fn();
  renderWith([message({ id: 5, dismissible: true })], { onMarkRead });

  fireEvent.click(
    screen.getByRole('button', { name: 'notifications.markAsRead' })
  );

  expect(onMarkRead).toHaveBeenCalledWith('5');
});

it('does not render a mark-as-read button for non-dismissible messages', () => {
  renderWith([message({ dismissible: false })], { onMarkRead: vi.fn() });

  expect(screen.queryByRole('button')).toBeNull();
});

it('does not render a mark-as-read button without an onMarkRead handler', () => {
  renderWith([message({ dismissible: true })]);

  expect(screen.queryByRole('button')).toBeNull();
});
