import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SeoMetadataContentType } from '@wepublish/editor/api';

import {
  applySeoSuggestions,
  getEmptySuggestionFields,
  SeoSuggestions,
} from './seoSuggestions';

const { generate, queryState } = vi.hoisted(() => ({
  generate: vi.fn(),
  queryState: { loading: false, error: undefined as Error | undefined },
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  getApiClientV2: () => undefined,
  useGenerateSeoMetadataLazyQuery: () => [generate, queryState],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const suggestion = {
  __typename: 'SeoMetadataSuggestion',
  seoTitle: 'Neues Velokonzept verabschiedet',
  seoDescription: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
  socialMediaTitle: 'Velokonzept verabschiedet',
  socialMediaDescription: null,
  slug: 'neues-velokonzept',
};

const renderSuggestions = (
  value: Parameters<typeof SeoSuggestions>[0]['value'] = {},
  context: Parameters<typeof SeoSuggestions>[0]['context'] = {
    title: 'Velokonzept',
    body: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
  }
) => {
  const onApply = vi.fn();

  render(
    <SeoSuggestions
      type={SeoMetadataContentType.Article}
      context={context}
      value={value}
      onApply={onApply}
    />
  );

  return { onApply };
};

const generateSuggestions = async () => {
  fireEvent.click(screen.getByText('seoSuggestions.generate'));

  await waitFor(() =>
    expect(screen.getByTestId('seo-suggestion-seoTitle')).toBeTruthy()
  );
};

describe('SeoSuggestions', () => {
  beforeEach(() => {
    generate.mockReset();
    generate.mockResolvedValue({
      data: { generateSeoMetadata: suggestion },
    });
    queryState.loading = false;
    queryState.error = undefined;
  });

  test('sends the content as context', async () => {
    renderSuggestions();

    await generateSuggestions();

    expect(generate).toHaveBeenCalledWith({
      variables: {
        input: {
          type: SeoMetadataContentType.Article,
          title: 'Velokonzept',
          lead: undefined,
          body: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
        },
      },
    });
  });

  test('shows suggestions without applying them', async () => {
    const { onApply } = renderSuggestions({ seoTitle: 'Existing title' });

    await generateSuggestions();

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue(suggestion.seoTitle)).toBeTruthy();
    expect(screen.getByText(/Existing title/)).toBeTruthy();
    expect(screen.queryByTestId('seo-suggestion-socialMediaDescription')).toBe(
      null
    );
  });

  test('applies a single field only', async () => {
    const { onApply } = renderSuggestions();

    await generateSuggestions();

    fireEvent.click(
      screen
        .getByTestId('seo-suggestion-seoDescription')
        .querySelector('button') as HTMLButtonElement
    );

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      seoDescription: suggestion.seoDescription,
    });
  });

  test('applies the edited suggestion', async () => {
    const { onApply } = renderSuggestions();

    await generateSuggestions();

    fireEvent.change(screen.getByDisplayValue(suggestion.seoTitle), {
      target: { value: '  Edited title  ' },
    });
    fireEvent.click(
      screen
        .getByTestId('seo-suggestion-seoTitle')
        .querySelector('button') as HTMLButtonElement
    );

    expect(onApply).toHaveBeenCalledWith({ seoTitle: 'Edited title' });
  });

  test('apply to empty fields keeps existing values untouched', async () => {
    const { onApply } = renderSuggestions({
      seoTitle: 'Existing title',
      slug: 'existing-slug',
      seoDescription: '',
    });

    await generateSuggestions();

    fireEvent.click(screen.getByText('seoSuggestions.applyToEmpty'));

    expect(onApply).toHaveBeenCalledWith({
      seoDescription: suggestion.seoDescription,
      socialMediaTitle: suggestion.socialMediaTitle,
    });
  });

  test('discarding removes the suggestions without applying', async () => {
    const { onApply } = renderSuggestions();

    await generateSuggestions();

    fireEvent.click(screen.getByText('seoSuggestions.discard'));

    expect(screen.queryByTestId('seo-suggestion-seoTitle')).toBe(null);
    expect(onApply).not.toHaveBeenCalled();
  });

  test('shows the error and no suggestions when generation fails', async () => {
    queryState.error = new Error('Invalid SEO metadata returned by AI');
    generate.mockResolvedValue({ error: queryState.error });

    const { onApply } = renderSuggestions();

    fireEvent.click(screen.getByText('seoSuggestions.generate'));

    await waitFor(() => expect(generate).toHaveBeenCalled());

    expect(
      screen.getByText('Invalid SEO metadata returned by AI')
    ).toBeTruthy();
    expect(screen.queryByTestId('seo-suggestion-seoTitle')).toBe(null);
    expect(onApply).not.toHaveBeenCalled();
  });

  test('is disabled without content', () => {
    renderSuggestions({}, { title: ' ', lead: '', body: '' });

    expect(
      screen.getByText('seoSuggestions.generate').closest('button')
    ).toHaveProperty('disabled', true);
    expect(screen.getByText('seoSuggestions.notEnoughContent')).toBeTruthy();
  });
});

describe('applySeoSuggestions', () => {
  test('only returns the requested non-empty fields', () => {
    expect(
      applySeoSuggestions(
        { seoTitle: ' Title ', seoDescription: '', slug: 'Mein Slug' },
        ['seoTitle', 'seoDescription', 'slug']
      )
    ).toEqual({ seoTitle: 'Title', slug: 'mein-slug' });
  });
});

describe('getEmptySuggestionFields', () => {
  test('selects fields that are empty and have a suggestion', () => {
    expect(
      getEmptySuggestionFields(
        { seoTitle: 'Set', seoDescription: ' ', socialMediaTitle: null },
        { seoTitle: 'A', seoDescription: 'B', socialMediaTitle: 'C', slug: '' }
      )
    ).toEqual(['seoDescription', 'socialMediaTitle']);
  });
});
