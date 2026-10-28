import '@testing-library/jest-dom/vitest';
import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteSettingsDocument } from '@wepublish/editor/api';
import {
  mockOperation,
  mockRichTextParagraph,
  mockWebsiteSettings,
} from '@wepublish/mocks/website';
import i18next, { t } from 'i18next';
import { ComponentProps } from 'react';
import { initReactI18next } from 'react-i18next';
import type {} from '../theme-vars';
import { RichtextEditor } from './richtext-editor';

const editorTheme = createTheme({ cssVariables: true });

const websiteSettings = mockOperation(WebsiteSettingsDocument, {
  variables: {},
  maxUsageCount: Number.POSITIVE_INFINITY,
  data: { __typename: 'Query', websiteSettings: mockWebsiteSettings() },
});

const renderEditor = (props: ComponentProps<typeof RichtextEditor> = {}) => {
  const onChange = vi.fn();
  const ui = (editorProps: ComponentProps<typeof RichtextEditor>) => (
    <MockedProvider mocks={[websiteSettings]}>
      <ThemeProvider theme={editorTheme}>
        <RichtextEditor
          onChange={onChange}
          {...editorProps}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  const result = render(ui(props));

  return {
    ...result,
    onChange,
    rerender: (next: ComponentProps<typeof RichtextEditor>) =>
      result.rerender(ui(next)),
  };
};

const findContent = () =>
  waitFor(() => {
    const content = document.querySelector<HTMLElement>('.tiptap');

    if (!content) {
      throw new Error('The editor has not mounted yet');
    }

    return content;
  });

const findMenuBar = () =>
  screen.findByRole('toolbar', { name: t('richtext.menuBar.label') });

beforeAll(() => i18next.use(initReactI18next).init({ lng: 'cimode' }));

describe('RichtextEditor', () => {
  it('shows the default value without reporting a change', async () => {
    const { onChange } = renderEditor({
      defaultValue: mockRichTextParagraph('Hallo Welt'),
    });

    expect(await findContent()).toHaveTextContent('Hallo Welt');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports typed text as json and html', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor();

    await user.type(await findContent(), 'Neu');

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        html: '<p>Neu</p>',
        json: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: null },
              content: [{ type: 'text', text: 'Neu' }],
            },
          ],
        },
      })
    );
  });

  it('formats the selected text from the menu bar', async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor({
      defaultValue: mockRichTextParagraph('Fett'),
    });

    await user.click(await findContent());
    await user.keyboard('{Control>}a{/Control}');
    await user.click(
      within(await findMenuBar()).getByRole('button', {
        name: t('richtext.menuBar.bold'),
      })
    );

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ html: '<p><strong>Fett</strong></p>' })
      )
    );
  });

  it('replaces the content with a new value without reporting a change', async () => {
    const { onChange, rerender } = renderEditor({
      value: mockRichTextParagraph('Erste Fassung'),
    });

    expect(await findContent()).toHaveTextContent('Erste Fassung');

    rerender({ value: mockRichTextParagraph('Zweite Fassung') });

    await waitFor(() =>
      expect(document.querySelector('.tiptap')).toHaveTextContent(
        'Zweite Fassung'
      )
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('cannot be edited while disabled and can again once enabled', async () => {
    const user = userEvent.setup();
    const { onChange, rerender } = renderEditor({ disabled: true });

    const content = await findContent();
    expect(content).toHaveAttribute('contenteditable', 'false');

    await user.type(content, 'Gesperrt');
    expect(onChange).not.toHaveBeenCalled();

    rerender({ disabled: false });

    await waitFor(() =>
      expect(document.querySelector('.tiptap')).toHaveAttribute(
        'contenteditable',
        'true'
      )
    );
  });

  it('names every menu bar control', async () => {
    renderEditor();

    const menuBar = within(await findMenuBar());

    expect(
      menuBar.getByRole('combobox', { name: t('richtext.menuBar.textStyle') })
    ).toBeInTheDocument();

    for (const key of [
      'undo',
      'redo',
      'bold',
      'italic',
      'underline',
      'strike',
      'subscript',
      'superscript',
      'textColor',
      'backgroundColor',
      'bulletList',
      'orderedList',
      'alignLeft',
      'alignCenter',
      'alignRight',
      'link',
      'table',
      'codeBlock',
      'blockquote',
      'invisibleCharacters',
    ]) {
      expect(
        menuBar.getByRole('button', { name: t(`richtext.menuBar.${key}`) })
      ).toBeInTheDocument();
    }
  });

  it('marks the active formatting as pressed', async () => {
    const user = userEvent.setup();
    renderEditor({ defaultValue: mockRichTextParagraph('Fett') });

    const menuBar = within(await findMenuBar());
    const bold = menuBar.getByRole('button', {
      name: t('richtext.menuBar.bold'),
    });
    const codeBlock = menuBar.getByRole('button', {
      name: t('richtext.menuBar.codeBlock'),
    });
    const blockquote = menuBar.getByRole('button', {
      name: t('richtext.menuBar.blockquote'),
    });
    const invisibleCharacters = menuBar.getByRole('button', {
      name: t('richtext.menuBar.invisibleCharacters'),
    });

    expect(bold).toHaveAttribute('aria-pressed', 'false');
    expect(codeBlock).toHaveAttribute('aria-pressed', 'false');
    expect(blockquote).toHaveAttribute('aria-pressed', 'false');
    expect(invisibleCharacters).toHaveAttribute('aria-pressed', 'false');

    await user.click(await findContent());
    await user.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));

    await user.click(blockquote);
    await waitFor(() =>
      expect(blockquote).toHaveAttribute('aria-pressed', 'true')
    );

    await user.click(invisibleCharacters);
    await waitFor(() =>
      expect(invisibleCharacters).toHaveAttribute('aria-pressed', 'true')
    );
  });

  it('names the table controls once the cursor is in a table', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(await findContent());
    await user.click(
      within(await findMenuBar()).getByRole('button', {
        name: t('richtext.menuBar.table'),
      })
    );

    const tableBar = within(
      await screen.findByRole('toolbar', { name: t('richtext.table.label') })
    );

    for (const key of [
      'addColumnBefore',
      'addColumnAfter',
      'deleteColumn',
      'addRowBefore',
      'addRowAfter',
      'deleteRow',
      'mergeCells',
      'splitCell',
    ]) {
      expect(
        tableBar.getByRole('button', { name: t(`richtext.table.${key}`) })
      ).toBeInTheDocument();
    }

    expect(
      tableBar.getByRole('button', { name: t('richtext.table.headerCell') })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
