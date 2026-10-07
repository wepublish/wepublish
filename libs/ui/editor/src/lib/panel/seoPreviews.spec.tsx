import { render, screen, within } from '@testing-library/react';
import { FullImageFragment } from '@wepublish/editor/api';

import { SeoPreviewData } from './seoPreviewData';
import { GooglePreview, SocialPreviews } from './seoPreviews';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.['domain'] ? `${key}:${options['domain']}` : key,
    i18n: { language: 'en' },
  }),
}));

const data: SeoPreviewData = {
  title: 'Stadtrat beschliesst Velokonzept',
  documentTitle: 'Stadtrat beschliesst Velokonzept — Example News',
  description: 'Der Stadtrat hat ein neues Velokonzept verabschiedet.',
  socialTitle: 'Neues Velokonzept',
  socialDescription: 'Zwanzig Kilometer neue Velowege.',
  image: {
    id: 'image',
    largeURL: 'https://media.example.com/large.jpg',
    squareURL: 'https://media.example.com/square.jpg',
    description: 'Velofahrer',
  } as unknown as FullImageFragment,
  url: 'https://example.com/a/velokonzept',
  domain: 'example.com',
  ignoredFields: [],
};

describe('GooglePreview', () => {
  test('renders google with the document title and description', () => {
    render(
      <GooglePreview
        data={data}
        siteName="Example News"
      />
    );

    const google = within(screen.getByTestId('seo-preview-google'));

    expect(google.getByText(data.documentTitle as string)).toBeTruthy();
    expect(google.getByText(data.description as string)).toBeTruthy();
    expect(google.getByText('Example News')).toBeTruthy();
  });

  test('warns about long google titles and ignored page fields', () => {
    render(
      <GooglePreview
        data={{
          ...data,
          documentTitle: 'x'.repeat(61),
          ignoredFields: ['seoTitle'],
        }}
      />
    );

    expect(screen.getByText('seoPreviews.googleTitleTooLong')).toBeTruthy();
    expect(screen.getByText('seoPreviews.pageIgnoresSeoFields')).toBeTruthy();
  });
});

describe('SocialPreviews', () => {
  test('renders the social previews with social texts and image', () => {
    render(<SocialPreviews data={data} />);

    for (const id of [
      'facebook',
      'linkedin',
      'whatsapp',
      'discord',
      'x-large',
      'x-summary',
    ]) {
      expect(
        within(screen.getByTestId(`seo-preview-${id}`)).getAllByText(
          data.socialTitle as string
        ).length
      ).toBeGreaterThan(0);
    }

    expect(
      within(screen.getByTestId('seo-preview-x-summary'))
        .getByRole('img')
        .getAttribute('src')
    ).toBe('https://media.example.com/square.jpg');
    expect(
      within(screen.getByTestId('seo-preview-facebook'))
        .getByRole('img')
        .getAttribute('src')
    ).toBe('https://media.example.com/large.jpg');
  });

  test('marks which x card the website uses', () => {
    render(<SocialPreviews data={data} />);

    expect(screen.getByText('seoPreviews.xLargeUsed')).toBeTruthy();
    expect(screen.getByText('seoPreviews.xSummaryUnused')).toBeTruthy();
  });

  test('shows placeholders without an image', () => {
    render(<SocialPreviews data={{ ...data, image: undefined }} />);

    expect(screen.getAllByText('No image').length).toBe(5);
  });
});
