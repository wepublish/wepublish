import { renderEditorForm } from '../../testing';
import { clearButtonOf } from '../../testing/autocomplete';
import { articleFixture, articleListMock } from '../../testing/picker-mocks';
import { screen, waitFor } from '@testing-library/react';
import {
  type ArticleListQueryVariables,
  ArticleSort,
  SortOrder,
} from '@wepublish/editor/api';
import type { FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const intro = articleFixture('article-intro', 'Einführung');
const recap = articleFixture('article-recap', 'Rückblick');
const untitled = articleFixture('article-untitled', null);
const filler = Array.from({ length: 200 }, (_, index) =>
  articleFixture(`article-filler-${index}`, `Meldung ${index}`)
);
const archived = articleFixture('article-archived', 'Archivperle');

const schema = z.object({
  articleID: formFields.article().meta({
    label: 'navigation.panels.linkTypeArticle',
    placeholder: 'navigation.panels.selectArticle',
  }),
  teaserID: formFields.article().nullish().meta({
    label: 'blocks.teaser.article',
    helperText: 'blocks.teaser.articleHelp',
  }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  defaultValues,
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  defaultValues?: FormDefaultValues<typeof schema>;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, { defaultValues });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field name="articleID" />
      <Field
        name="teaserID"
        disabled={disabled}
        readOnly={readOnly}
      />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const article = () => picker(/^navigation\.panels\.linkTypeArticle\*/);
const teaser = () => picker(/^blocks\.teaser\.article/);

let requests: ArticleListQueryVariables[] = [];

const mocks = (articles = [intro, recap, untitled]) => [
  articleListMock(articles, variables => requests.push(variables)),
];

beforeEach(() => {
  requests = [];
});

describe('ArticleField', () => {
  it('labels the picker, marks a required one and explains an optional one', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(article()).toBeRequired();
    expect(article()).toHaveAttribute(
      'placeholder',
      'navigation.panels.selectArticle'
    );
    expect(teaser()).not.toHaveAccessibleName(/\*/);
    expect(teaser()).not.toBeRequired();
    expect(teaser()).toHaveAccessibleDescription('blocks.teaser.articleHelp');
  });

  it('offers the latest articles first and submits the id of the picked one', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(article());
    await user.click(await screen.findByRole('option', { name: 'Rückblick' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { articleID: 'article-recap', teaserID: null },
        expect.anything()
      )
    );
    expect(requests[0]).toEqual({
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
      take: 200,
    });
  });

  it('names an article without a title', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(article());

    expect(
      await screen.findByRole('option', { name: 'articles.overview.untitled' })
    ).toBeInTheDocument();
  });

  it('searches the articles by title on the server', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.type(article(), 'Rück');

    await waitFor(() =>
      expect(
        screen.getAllByRole('option').map(option => option.textContent)
      ).toEqual(['Rückblick'])
    );
    expect(requests).toContainEqual(
      expect.objectContaining({ filter: { title: 'Rück' } })
    );
  });

  it('shows the title of a stored article that is not among the latest ones', async () => {
    renderEditorForm(
      <View defaultValues={{ articleID: 'article-archived' }} />,
      { mocks: mocks([...filler, archived]) }
    );

    await waitFor(() => expect(article()).toHaveValue('Archivperle'));
    expect(requests).toContainEqual({
      filter: { ids: ['article-archived'] },
      take: 1,
    });
  });

  it('asks for no single article while nothing is stored', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(article());
    await screen.findByRole('option', { name: 'Einführung' });

    expect(requests.some(variables => variables.filter?.ids)).toBe(false);
  });

  it('submits null once an optional article is cleared and reports a cleared required one', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          articleID: 'article-intro',
          teaserID: 'article-recap',
        }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(teaser()).toHaveValue('Rückblick'));

    await user.click(await clearButtonOf(user, teaser()));
    await user.click(await clearButtonOf(user, article()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(article()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(article());
    await user.click(await screen.findByRole('option', { name: 'Einführung' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { articleID: 'article-intro', teaserID: null },
        expect.anything()
      )
    );
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(teaser()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(teaser());

    expect(teaser()).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
