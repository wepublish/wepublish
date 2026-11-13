import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { forwardRef } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { MailTemplateEdit } from './mail-template-edit';

const { mutate, letterChannel } = vi.hoisted(() => ({
  mutate: vi.fn(async () => ({ data: undefined })),
  letterChannel: { paperLetters: false, letterAvailable: false },
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useLazyQuery: vi.fn(() => [
    vi.fn(() => Promise.resolve({ data: undefined })),
    { data: undefined },
  ]),
  useMutation: vi.fn(() => [mutate, { loading: false }]),
  useApolloClient: vi.fn(() => ({})),
}));

vi.mock('./use-letter-channel', () => ({
  useLetterChannel: () => letterChannel,
}));

vi.mock('./html-visual-editor', () => ({
  HtmlVisualEditor: forwardRef(() => <div data-testid="visual-editor" />),
}));

vi.mock('./html-source-editor', () => ({
  HtmlSourceEditor: forwardRef(() => <div data-testid="source-editor" />),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MailTemplateEdit />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const saveNew = () => {
  fireEvent.change(
    screen.getByRole('textbox', { name: 'mailTemplates.name' }),
    { target: { value: 'Vertrag' } }
  );
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: /^mailTemplates\.edit\.mailType/ })
  );
  // The first option is the empty placeholder.
  fireEvent.click(screen.getAllByRole('option')[1]);
  fireEvent.click(screen.getByRole('button', { name: 'mailTemplates.save' }));
};

describe('MailTemplateEdit attachments', () => {
  afterEach(() => {
    letterChannel.paperLetters = false;
    mutate.mockClear();
  });

  it('offers no attachments while paper letters are off', () => {
    renderPage();

    expect(
      screen.queryByRole('combobox', { name: 'mailTemplates.edit.attachments' })
    ).toBeNull();
  });

  it('offers the attachments with paper letters, even without a letter integration', () => {
    letterChannel.paperLetters = true;
    renderPage();

    expect(
      screen.getByRole('combobox', { name: 'mailTemplates.edit.attachments' })
    ).toBeTruthy();
  });

  it('saves the attachments with paper letters on', () => {
    letterChannel.paperLetters = true;
    renderPage();

    saveNew();

    expect(mutate).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({ name: 'Vertrag', attachmentIds: [] }),
      },
    });
  });

  // Without the feature the api refuses attachments; leaving them out keeps
  // whatever the template has.
  it('leaves the attachments alone with paper letters off', () => {
    renderPage();

    saveNew();

    expect(mutate).toHaveBeenCalledTimes(1);
    expect((mutate.mock.calls[0] as any)[0].variables.input).not.toHaveProperty(
      'attachmentIds'
    );
  });
});

describe('MailTemplateEdit', () => {
  it('labels every detail and preview field', () => {
    renderPage();

    expect(
      screen.getByRole('combobox', { name: /^mailTemplates\.edit\.mailType/ })
    ).toBeTruthy();
    for (const name of [
      'mailTemplates.name',
      'mailTemplates.description',
      'mailTemplates.subject',
    ]) {
      expect(screen.getByRole('textbox', { name })).toBeTruthy();
    }
    expect(
      screen.getByRole('combobox', {
        name: 'mailTemplates.edit.sampleSubscription',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', {
        name: 'mailTemplates.edit.contentWidth',
      })
    ).toBeTruthy();
  });

  it('marks the name as required', () => {
    renderPage();

    expect(
      screen.getByRole('textbox', { name: 'mailTemplates.name' })
    ).toBeRequired();
  });

  it('titles both cards as level-two headings', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'mailTemplates.edit.details',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'mailTemplates.edit.previewAndTest',
      })
    ).toBeTruthy();
  });

  it('shows which editor mode is active', () => {
    renderPage();

    const modes = screen.getByRole('group', {
      name: 'mailTemplates.edit.bodyMode',
    });
    const visual = within(modes).getByRole('button', {
      name: 'mailTemplates.wysiwyg',
    });
    const html = within(modes).getByRole('button', {
      name: 'mailTemplates.rawHtml',
    });

    expect(visual).toHaveAttribute('aria-pressed', 'true');
    expect(html).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(html);

    expect(html).toHaveAttribute('aria-pressed', 'true');
    expect(visual).toHaveAttribute('aria-pressed', 'false');
  });

  it('flags a missing name on the field and moves focus to it', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'mailTemplates.save' }));

    const nameField = screen.getByRole('textbox', {
      name: 'mailTemplates.name',
    });
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
    expect(nameField).toHaveAccessibleDescription(
      'mailTemplates.edit.nameRequired'
    );
    expect(nameField).toHaveFocus();
  });

  it('opens the purpose list', () => {
    renderPage();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /^mailTemplates\.edit\.mailType/ })
    );

    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('moves focus to the purpose when saving without one', () => {
    renderPage();

    fireEvent.change(
      screen.getByRole('textbox', { name: 'mailTemplates.name' }),
      { target: { value: 'Welcome' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'mailTemplates.save' }));

    const purpose = screen.getByRole('combobox', {
      name: /^mailTemplates\.edit\.mailType/,
    });
    expect(purpose).toHaveFocus();
    expect(purpose).toHaveAttribute('aria-required', 'true');
  });
});
