import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MailChannel, MailTemplateContext } from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { forwardRef } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { MailTemplateEdit } from './mail-template-edit';

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value ?? '';

const mutations: Record<string, ReturnType<typeof vi.fn>> = {};
const mutation = (name: string) => (mutations[name] ??= vi.fn());
const loadTemplate = vi.fn();
const clientQuery = vi.fn();
const letterChannel = { paperLetters: false, letterAvailable: false };

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(() => ({ data: undefined, loading: false })),
  useLazyQuery: vi.fn((document: unknown) => [
    operationName(document) === 'MailTemplateById' ? loadTemplate : (
      vi.fn(() => Promise.resolve({ data: undefined }))
    ),
    { data: undefined },
  ]),
  useMutation: vi.fn((document: unknown) => [
    mutation(operationName(document)),
    { loading: false },
  ]),
  useApolloClient: vi.fn(() => ({ query: clientQuery })),
}));

vi.mock('./use-letter-channel', () => ({
  useLetterChannel: () => letterChannel,
}));

vi.mock('./letter-appendix-picker', () => ({
  LetterAppendixPicker: () => <div data-testid="appendix-picker" />,
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

const renderPage = (path = '/mailtemplates/create') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <Routes>
            <Route
              path="/mailtemplates/create"
              element={<MailTemplateEdit />}
            />
            <Route
              path="/mailtemplates/edit/:id"
              element={<MailTemplateEdit />}
            />
            <Route
              path="/mailtemplates"
              element={<div />}
            />
          </Routes>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

const savedVariant = (channel: MailChannel, over = {}) => ({
  id: `v-${channel}`,
  channel,
  subject: `Subject ${channel}`,
  htmlContent: `<html><body><p>${channel}</p></body></html>`,
  textContent: null,
  letterLayoutId: null,
  letterAppendixId: null,
  ...over,
});

const savedTemplate = (channels: MailChannel[], over = {}) => ({
  id: 'tpl-1',
  name: 'Rechnung',
  description: '',
  subject: 'Subject mail',
  context: MailTemplateContext.Custom,
  status: 'ok',
  channels,
  variants: channels.map(channel => savedVariant(channel)),
  ...over,
});

const versionTab = (channel: MailChannel) =>
  within(
    screen.getByRole('tablist', { name: 'mailTemplates.edit.versions' })
  ).getByRole('tab', { name: `deliveryMode.channel.${channel}` });

const subjectField = () =>
  screen.getByRole('textbox', { name: 'mailTemplates.subject' });

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mutations).forEach(name => delete mutations[name]);
  letterChannel.paperLetters = false;
  letterChannel.letterAvailable = false;
  loadTemplate.mockResolvedValue({ data: undefined });
});

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

    expect(mutation('CreateMailTemplate')).toHaveBeenCalledWith({
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

    expect(mutation('CreateMailTemplate')).toHaveBeenCalledTimes(1);
    expect(
      mutation('CreateMailTemplate').mock.calls[0][0].variables.input
    ).not.toHaveProperty('attachmentIds');
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

  it('explains every editor mode on a line of its own in one tooltip', () => {
    renderPage();

    const help = screen.getByRole('button', {
      name: /bodyModeHints\.visual[\s\S]*bodyModeHints\.html[\s\S]*bodyModeHints\.text/,
    });

    expect(help.getAttribute('aria-label')?.split('\n')).toEqual([
      '• mailTemplates.wysiwyg: mailTemplates.edit.bodyModeHints.visual',
      '• mailTemplates.rawHtml: mailTemplates.edit.bodyModeHints.html',
      '• mailTemplates.textContent: mailTemplates.edit.bodyModeHints.text',
    ]);
  });

  it('shows no separate hint above the plain text', () => {
    renderPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.textContent' })
    );

    expect(
      screen.queryByText('mailTemplates.edit.textContentReadonlyHint')
    ).toBeNull();
  });

  it('marks the plain text as generated, on the text itself', () => {
    renderPage();

    expect(
      screen.queryByText('mailTemplates.edit.textContentGenerated')
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.textContent' })
    );

    expect(
      screen.getByText('mailTemplates.edit.textContentGenerated')
    ).toBeTruthy();
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

  it('explains each purpose in a tooltip instead of a line below it', () => {
    renderPage();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /^mailTemplates\.edit\.mailType/ })
    );

    const list = screen.getByRole('listbox');
    const purposes = within(list).getAllByRole('option').slice(1);

    expect(purposes.length).toBeGreaterThan(0);
    for (const purpose of purposes) {
      expect(
        within(purpose).getByRole('button', {
          name: /^mailTemplates\.purposeDescriptions\./,
        })
      ).toBeTruthy();
    }
    expect(
      within(list).queryByText(/^mailTemplates\.purposeDescriptions\./)
    ).toBeNull();
  });

  it('shows the chosen purpose by its name alone', () => {
    renderPage();

    const purpose = screen.getByRole('combobox', {
      name: /^mailTemplates\.edit\.mailType/,
    });
    fireEvent.mouseDown(purpose);
    fireEvent.click(
      within(screen.getByRole('listbox')).getAllByRole('option')[1]
    );

    expect(within(purpose).queryByRole('button')).toBeNull();
    expect(purpose.textContent).not.toBe('');
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

  describe('versions per channel', () => {
    const withLetters = () => {
      letterChannel.paperLetters = true;
      letterChannel.letterAvailable = true;
    };

    it('shows no version tabs while the medium has no letters', () => {
      renderPage();

      expect(screen.queryByRole('tablist')).toBeNull();
      expect(subjectField()).toBeTruthy();
    });

    const letterText = (mode: 'same' | 'own') =>
      within(
        screen.getByRole('radiogroup', {
          name: 'mailTemplates.edit.letterText.label',
        })
      ).getByRole('radio', { name: `mailTemplates.edit.letterText.${mode}` });

    const loadSaved = async (channels: MailChannel[], over = {}) => {
      loadTemplate.mockResolvedValue({
        data: { mailTemplate: savedTemplate(channels, over) },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() =>
        expect(subjectField()).toHaveValue(`Subject ${channels[0]}`)
      );
    };

    it('starts a new template with an email and a letter that says the same', () => {
      withLetters();
      renderPage();

      expect(versionTab(MailChannel.Mail)).toHaveAttribute(
        'aria-selected',
        'true'
      );

      fireEvent.click(versionTab(MailChannel.Letter));

      expect(letterText('same')).toBeChecked();
      expect(
        screen.getByRole('combobox', {
          name: /^mailTemplates\.edit\.letterLayout/,
        })
      ).toBeTruthy();
    });

    it('shows the words of the email on a letter that says the same, not to be typed into', () => {
      withLetters();
      renderPage();

      fireEvent.change(subjectField(), { target: { value: 'Ihre Rechnung' } });
      fireEvent.click(versionTab(MailChannel.Letter));

      expect(subjectField()).toHaveValue('Ihre Rechnung');
      expect(subjectField()).toBeDisabled();
      expect(
        screen.queryByRole('group', { name: 'mailTemplates.edit.bodyMode' })
      ).toBeNull();
      expect(
        screen.getByText('mailTemplates.edit.letterText.sameNote')
      ).toBeTruthy();
    });

    it('gives the letter a text of its own, starting from the email', () => {
      withLetters();
      renderPage();

      fireEvent.change(subjectField(), { target: { value: 'Email subject' } });
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.click(letterText('own'));

      expect(letterText('own')).toBeChecked();
      expect(subjectField()).toBeEnabled();
      expect(subjectField()).toHaveValue('Email subject');
      expect(
        screen.getByRole('group', { name: 'mailTemplates.edit.bodyMode' })
      ).toBeTruthy();
    });

    it('keeps a subject per version once the letter has its own text', () => {
      withLetters();
      renderPage();

      fireEvent.change(subjectField(), { target: { value: 'Email subject' } });
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.click(letterText('own'));
      fireEvent.change(subjectField(), { target: { value: 'Letter title' } });
      fireEvent.click(versionTab(MailChannel.Mail));

      expect(subjectField()).toHaveValue('Email subject');

      fireEvent.click(versionTab(MailChannel.Letter));

      expect(subjectField()).toHaveValue('Letter title');
    });

    it('asks before throwing the letter text away for the email text', async () => {
      withLetters();
      await loadSaved([MailChannel.Mail, MailChannel.Letter]);
      fireEvent.click(versionTab(MailChannel.Letter));

      expect(letterText('own')).toBeChecked();

      fireEvent.click(letterText('same'));

      const dialog = screen.getByRole('dialog', {
        name: 'mailTemplates.edit.letterText.confirm.title',
      });

      fireEvent.click(
        within(dialog).getByRole('button', {
          name: 'mailTemplates.edit.letterText.confirm.confirm',
        })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(letterText('same')).toBeChecked();
      expect(subjectField()).toHaveValue('Subject mail');
      expect(subjectField()).toBeDisabled();
    });

    it('keeps the letter text when that question is cancelled', async () => {
      withLetters();
      await loadSaved([MailChannel.Mail, MailChannel.Letter]);
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.click(letterText('same'));
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'mailTemplates.cancel',
        })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(letterText('own')).toBeChecked();
      expect(subjectField()).toHaveValue('Subject letter');
    });

    it('adds a letter to a saved template as one that says the same', async () => {
      withLetters();
      await loadSaved([MailChannel.Mail]);

      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.addVersion.letter',
        })
      );

      expect(versionTab(MailChannel.Letter)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(letterText('same')).toBeChecked();
      expect(subjectField()).toHaveValue('Subject mail');
    });

    it('saves a letter that says the same without a copy of the email', async () => {
      withLetters();
      await loadSaved([MailChannel.Mail]);
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.addVersion.letter',
        })
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'mailTemplates.save' })
      );

      await waitFor(() =>
        expect(mutation('UpdateMailTemplate')).toHaveBeenCalled()
      );
      expect(
        mutation('UpdateMailTemplate').mock.calls[0][0].variables.input
          .variants[1]
      ).toEqual({
        channel: MailChannel.Letter,
        subject: '',
        htmlContent: '',
        sameAsMail: true,
        letterLayoutId: null,
        letterAppendixId: null,
      });
    });

    it('opens a saved letter that says the same as such', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter], {
            variants: [
              savedVariant(MailChannel.Mail),
              savedVariant(MailChannel.Letter, {
                subject: '',
                htmlContent: '',
                sameAsMail: true,
              }),
            ],
          }),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));
      fireEvent.click(versionTab(MailChannel.Letter));

      expect(letterText('same')).toBeChecked();
      expect(subjectField()).toHaveValue('Subject mail');
    });

    it('has no letter on a new template whose purpose is email only', () => {
      withLetters();
      renderPage();

      expect(versionTab(MailChannel.Letter)).toBeTruthy();

      fireEvent.mouseDown(
        screen.getByRole('combobox', {
          name: /^mailTemplates\.edit\.mailType/,
        })
      );
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: /mailTemplates\.placeholderContexts\.account/,
        })
      );

      expect(
        screen.queryByRole('tab', { name: 'deliveryMode.channel.letter' })
      ).toBeNull();
    });

    it('leaves the letter its words when the email is removed', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter], {
            variants: [
              savedVariant(MailChannel.Mail),
              savedVariant(MailChannel.Letter, {
                subject: '',
                htmlContent: '',
                sameAsMail: true,
              }),
            ],
          }),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.removeVersion',
        })
      );
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'mailTemplates.edit.removeVersionConfirm.confirm',
        })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(subjectField()).toHaveValue('Subject mail');
      expect(subjectField()).toBeEnabled();

      fireEvent.click(
        screen.getByRole('button', { name: 'mailTemplates.save' })
      );

      await waitFor(() =>
        expect(mutation('UpdateMailTemplate')).toHaveBeenCalled()
      );
      expect(
        mutation('UpdateMailTemplate').mock.calls[0][0].variables.input.variants
      ).toEqual([
        expect.objectContaining({
          channel: MailChannel.Letter,
          subject: 'Subject mail',
          sameAsMail: false,
        }),
      ]);
    });

    it('offers no letter version for a purpose that is email only', () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail], {
            context: MailTemplateContext.Account,
          }),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      return waitFor(() =>
        expect(
          screen.getByRole('button', {
            name: 'mailTemplates.edit.addVersion.letter',
          })
        ).toBeDisabled()
      );
    });

    it('opens the versions a saved template has', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));

      fireEvent.click(versionTab(MailChannel.Letter));

      expect(subjectField()).toHaveValue('Subject letter');
    });

    it('opens the letter of a template written as a letter only', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: { mailTemplate: savedTemplate([MailChannel.Letter]) },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject letter'));
      expect(versionTab(MailChannel.Letter)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.addVersion.mail',
        })
      ).toBeEnabled();
    });

    it('previews a letter as a letter and sends no test mail from it', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));

      expect(
        screen.getByRole('button', { name: 'mailTemplates.edit.sendTest' })
      ).toBeTruthy();
      expect(
        screen.queryByRole('button', {
          name: 'mailTemplates.edit.previewLetter',
        })
      ).toBeNull();

      fireEvent.click(versionTab(MailChannel.Letter));

      expect(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.previewLetter',
        })
      ).toBeTruthy();
      expect(
        screen.queryByRole('button', { name: 'mailTemplates.edit.sendTest' })
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'mailTemplates.textContent' })
      ).toBeNull();
    });

    it('saves every version of the template', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.change(subjectField(), { target: { value: 'Neuer Titel' } });
      fireEvent.click(
        screen.getByRole('button', { name: 'mailTemplates.save' })
      );

      await waitFor(() =>
        expect(mutation('UpdateMailTemplate')).toHaveBeenCalled()
      );

      const { variables } = mutation('UpdateMailTemplate').mock.calls[0][0];

      expect(variables.id).toBe('tpl-1');
      expect(variables.input.variants).toEqual([
        expect.objectContaining({
          channel: MailChannel.Mail,
          subject: 'Subject mail',
        }),
        expect.objectContaining({
          channel: MailChannel.Letter,
          subject: 'Neuer Titel',
          letterLayoutId: null,
        }),
      ]);
      expect(mutation('DeleteMailTemplateVariant')).not.toHaveBeenCalled();
    });

    it('removes a saved version on save, after the others are written', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.removeVersion',
        })
      );

      // Asked first: the version is still there until confirmed. Behind the
      // open dialog the page is hidden from the accessibility tree.
      expect(
        screen.getByRole('tab', {
          name: 'deliveryMode.channel.letter',
          hidden: true,
        })
      ).toBeTruthy();

      fireEvent.click(
        within(
          screen.getByRole('dialog', {
            name: 'mailTemplates.edit.removeVersionConfirm.title.letter',
          })
        ).getByRole('button', {
          name: 'mailTemplates.edit.removeVersionConfirm.confirm',
        })
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(
        screen.queryByRole('tab', { name: 'deliveryMode.channel.letter' })
      ).toBeNull();
      expect(subjectField()).toHaveValue('Subject mail');
      expect(mutation('DeleteMailTemplateVariant')).not.toHaveBeenCalled();

      fireEvent.click(
        screen.getByRole('button', { name: 'mailTemplates.save' })
      );

      await waitFor(() =>
        expect(mutation('DeleteMailTemplateVariant')).toHaveBeenCalledWith({
          variables: { templateId: 'tpl-1', channel: MailChannel.Letter },
        })
      );
      expect(
        mutation('UpdateMailTemplate').mock.calls[0][0].variables.input.variants
      ).toEqual([expect.objectContaining({ channel: MailChannel.Mail })]);
      expect(
        mutation('UpdateMailTemplate').mock.invocationCallOrder[0]
      ).toBeLessThan(
        mutation('DeleteMailTemplateVariant').mock.invocationCallOrder[0]
      );
    });

    it('keeps the version when the removal is cancelled', async () => {
      withLetters();
      loadTemplate.mockResolvedValue({
        data: {
          mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
        },
      });
      renderPage('/mailtemplates/edit/tpl-1');

      await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));
      fireEvent.click(versionTab(MailChannel.Letter));
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.removeVersion',
        })
      );

      const dialog = screen.getByRole('dialog');
      const buttons = within(dialog).getAllByRole('button');

      // Cancel on the left, as in the other dialogs.
      expect(buttons[0]).toHaveAccessibleName('mailTemplates.cancel');

      fireEvent.click(buttons[0]);

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(versionTab(MailChannel.Letter)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(subjectField()).toHaveValue('Subject letter');
    });

    it('keeps the last version: there is nothing to remove it for', async () => {
      withLetters();
      await loadSaved([MailChannel.Mail]);

      expect(
        screen.queryByRole('button', {
          name: 'mailTemplates.edit.removeVersion',
        })
      ).toBeNull();
    });

    it('creates a new template with its versions', async () => {
      renderPage();

      fireEvent.change(
        screen.getByRole('textbox', { name: 'mailTemplates.name' }),
        { target: { value: 'Welcome' } }
      );
      fireEvent.mouseDown(
        screen.getByRole('combobox', {
          name: /^mailTemplates\.edit\.mailType/,
        })
      );
      fireEvent.click(
        within(screen.getByRole('listbox')).getAllByRole('option')[1]
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'mailTemplates.save' })
      );

      await waitFor(() =>
        expect(mutation('CreateMailTemplate')).toHaveBeenCalled()
      );

      const { input } =
        mutation('CreateMailTemplate').mock.calls[0][0].variables;

      expect(input.variants).toEqual([
        expect.objectContaining({ channel: MailChannel.Mail }),
      ]);
      expect(input).not.toHaveProperty('htmlContent');
    });
  });
});

describe('MailTemplateEdit previews', () => {
  beforeEach(() => {
    letterChannel.paperLetters = true;
    letterChannel.letterAvailable = true;
    URL.createObjectURL = vi.fn(() => 'blob:letter');
    URL.revokeObjectURL = vi.fn();
    loadTemplate.mockResolvedValue({
      data: {
        mailTemplate: savedTemplate([MailChannel.Mail, MailChannel.Letter]),
      },
    });
    clientQuery.mockResolvedValue({
      data: {
        mailTemplatePreview: { subject: 'Hallo', html: '<p>Hallo</p>' },
        mailTemplateLetterPreview: { pdf: btoa('%PDF') },
      },
    });
  });

  it('closes the email preview with a button', async () => {
    renderPage('/mailtemplates/edit/tpl-1');
    await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));

    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.edit.preview' })
    );
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'mailTemplates.editor.close',
      })
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes the letter preview with a button', async () => {
    renderPage('/mailtemplates/edit/tpl-1');
    await waitFor(() => expect(subjectField()).toHaveValue('Subject mail'));

    fireEvent.click(versionTab(MailChannel.Letter));
    fireEvent.click(
      screen.getByRole('button', { name: 'mailTemplates.edit.previewLetter' })
    );
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'mailTemplates.editor.close',
      })
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
