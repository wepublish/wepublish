/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { OneMessages } from './oneMessages';
import { isMinimized, setMinimized, useOneMessages } from './oneMessages.hooks';
import type { OneMessage } from './oneMessages.types';

jest.mock('./oneMessages.hooks', () => ({
  useOneMessages: jest.fn(),
  isMinimized: jest.fn(() => false),
  setMinimized: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseOneMessages = useOneMessages as jest.Mock;
const mockedIsMinimized = isMinimized as jest.Mock;
const mockedSetMinimized = setMinimized as jest.Mock;

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

const renderWith = (messages: OneMessage[]) => {
  mockedUseOneMessages.mockReturnValue(messages);
  return render(<OneMessages />);
};

beforeEach(() => {
  mockedIsMinimized.mockReturnValue(false);
  mockedSetMinimized.mockClear();
});

it('renders nothing when there are no messages', () => {
  const { container } = renderWith([]);

  expect(container.firstChild).toBeNull();
});

it('renders the We.Publish team header above the messages', () => {
  renderWith([message()]);

  expect(screen.getByText('oneMessages.header')).toBeTruthy();
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

it('minimizes a dismissible message when its close button is clicked', () => {
  renderWith([message({ id: 5, dismissible: true })]);

  const closeButton = screen.getByRole('button');
  fireEvent.click(closeButton);

  expect(mockedSetMinimized).toHaveBeenCalledWith(5, true);
});

it('does not render a close button for non-dismissible messages', () => {
  renderWith([message({ dismissible: false })]);

  expect(screen.queryByRole('button')).toBeNull();
});

it('renders a minimized message as just the title without the body', () => {
  mockedIsMinimized.mockReturnValue(true);
  const { container } = renderWith([
    message({ id: 8, title: 'Minimized notice', body: 'Hidden body' }),
  ]);

  expect(screen.getByText('Minimized notice')).toBeTruthy();
  expect(screen.queryByText('Hidden body')).toBeNull();
  expect(container.querySelector('p')).toBeNull();
});

it('expands a minimized message when it is clicked', () => {
  mockedIsMinimized.mockReturnValue(true);
  renderWith([message({ id: 8, title: 'Minimized notice' })]);

  fireEvent.click(screen.getByText('Minimized notice'));

  expect(mockedSetMinimized).toHaveBeenCalledWith(8, false);
});
