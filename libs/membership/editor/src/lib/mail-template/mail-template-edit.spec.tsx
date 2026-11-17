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
  useApolloClient: vi.fn(() => ({})),
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

    it('starts a new template with the email version only', () => {
      withLetters();
      renderPage();

      expect(versionTab(MailChannel.Mail)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        screen.queryByRole('tab', { name: 'deliveryMode.channel.letter' })
      ).toBeNull();
      expect(
        screen.queryByRole('combobox', {
          name: /^mailTemplates\.edit\.letterLayout/,
        })
      ).toBeNull();
    });

    it('adds a letter version as a copy of the email and opens it', () => {
      withLetters();
      renderPage();

      fireEvent.change(subjectField(), { target: { value: 'Ihre Rechnung' } });
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.addVersion.letter',
        })
      );

      expect(versionTab(MailChannel.Letter)).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(subjectField()).toHaveValue('Ihre Rechnung');
      expect(
        screen.getByRole('combobox', {
          name: /^mailTemplates\.edit\.letterLayout/,
        })
      ).toBeTruthy();
    });

    it('keeps a subject per version', () => {
      withLetters();
      renderPage();

      fireEvent.change(subjectField(), { target: { value: 'Email subject' } });
      fireEvent.click(
        screen.getByRole('button', {
          name: 'mailTemplates.edit.addVersion.letter',
        })
      );
      fireEvent.change(subjectField(), { target: { value: 'Letter title' } });
      fireEvent.click(versionTab(MailChannel.Mail));

      expect(subjectField()).toHaveValue('Email subject');

      fireEvent.click(versionTab(MailChannel.Letter));

      expect(subjectField()).toHaveValue('Letter title');
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

    it('keeps the last version: there is nothing to remove it for', () => {
      withLetters();
      renderPage();

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
