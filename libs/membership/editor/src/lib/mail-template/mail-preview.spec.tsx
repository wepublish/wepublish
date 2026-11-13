import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { MailPreview } from './mail-preview';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const attachments = [
  { filename: 'Vertrag 2026.pdf', pdf: btoa('%PDF-contract') },
  { filename: 'agb.pdf', pdf: btoa('%PDF-terms') },
];

describe('MailPreview attachments', () => {
  beforeEach(() => {
    // jsdom has no object urls; the pdf frame needs one.
    URL.createObjectURL = vi.fn(() => 'about:blank');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(cleanup);

  it('names the attachments with the subject, in their order', () => {
    render(
      <MailPreview
        html="<p>Hallo</p>"
        subject="Ihr Vertrag"
        attachments={attachments}
      />
    );

    expect(
      screen
        .getAllByRole('button', { name: /\.pdf$/ })
        .map(button => button.textContent)
    ).toEqual(['Vertrag 2026.pdf', 'agb.pdf']);
  });

  it('opens an attachment as the pdf the mail carries, until closed', async () => {
    render(
      <MailPreview
        html="<p>Hallo</p>"
        subject="Ihr Vertrag"
        attachments={attachments}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'agb.pdf' }));

    const dialog = screen.getByRole('dialog', { name: 'agb.pdf' });
    expect(dialog.querySelector('iframe')?.getAttribute('title')).toBe(
      'agb.pdf'
    );
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(
      'about:blank'
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.editor.close' })
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows no attachments for a mail without any', () => {
    render(
      <MailPreview
        html="<p>Hallo</p>"
        subject="Newsletter"
        attachments={[]}
      />
    );

    expect(screen.queryByText('mailTemplates.editor.attachments')).toBeNull();
  });
});
