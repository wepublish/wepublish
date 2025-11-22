import { Article, Page } from '@wepublish/website/api';
import { generateSitemap } from './sitemap-generator';
import { mockArticle, mockPage } from '@wepublish/storybook/mocks';

const pageUrls = [
  'https://example.com',
  'https://example.com/login',
  'https://example.com/signup',
];
const article = mockArticle() as Article;
const page = mockPage() as Page;

const generate = generateSitemap({
  siteUrl: 'https://wepublish.ch',
  title: 'We.Publish Feed',
});

it('should setup the feed', () => {
  const articles = [mockArticle(), mockArticle()] as Article[];
  const pages = [mockPage(), mockPage()] as Page[];

  expect(generate(articles, pages, pageUrls)).toMatchSnapshot();
});

it('should throw an error if too many ', () => {
  const articles = [] as Article[];
  const pages = [] as Page[];

  for (let i = 0; i < 25000; i++) {
    articles.push(article);
    pages.push(page);
  }

  expect(() => generate(articles, pages, pageUrls)).toThrow();
});
