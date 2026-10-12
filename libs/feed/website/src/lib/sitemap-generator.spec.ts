import { FullArticleFragment, FullPageFragment } from '@wepublish/website/api';
import { generateSitemap } from './sitemap-generator';
import { mockArticle, mockPage } from '@wepublish/storybook/mocks';

const pageUrls = [
  'https://example.com',
  'https://example.com/login',
  'https://example.com/signup',
];
const article = mockArticle() as FullArticleFragment;
const page = mockPage() as FullPageFragment;

const generate = generateSitemap({
  siteUrl: 'https://wepublish.ch',
  title: 'We.Publish Feed',
});

it('should setup the feed', () => {
  const articles = [mockArticle(), mockArticle()] as FullArticleFragment[];
  const pages = [mockPage(), mockPage()] as FullPageFragment[];

  expect(generate(articles, pages, pageUrls)).toMatchSnapshot();
});

it('should throw an error if too many ', () => {
  const articles = [] as FullArticleFragment[];
  const pages = [] as FullPageFragment[];

  for (let i = 0; i < 25000; i++) {
    articles.push(article);
    pages.push(page);
  }

  expect(() => generate(articles, pages, pageUrls)).toThrow();
});
