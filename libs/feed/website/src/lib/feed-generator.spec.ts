import { Article } from '@wepublish/website/api';
import { generateFeed } from './feed-generator';
import { mockArticle, mockAuthor, mockImage } from '@wepublish/storybook/mocks';
import { faker } from '@faker-js/faker/.';

const author = mockAuthor();

const generate = generateFeed({
  id: 'https://wepublish.ch',
  copyright: 'We.Publish',
  title: 'We.Publish Feed',
  categories: ['foo', 'bar'],
  author: {
    name: author.name,
    link: author.url,
  },
  updated: new Date('2023-01-01'),
});

faker.seed(1);

it('should setup the feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as Article[];

  expect(await generate(articles)).toMatchSnapshot();
});

it('should generate the RSS feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as Article[];

  expect((await generate(articles)).rss2()).toMatchSnapshot();
});

it('should generate the atom feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as Article[];

  expect((await generate(articles)).atom1()).toMatchSnapshot();
});

it('should generate the json feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as Article[];

  expect((await generate(articles)).json1()).toMatchSnapshot();
});

it('should escape ampersands in image URLs for RSS feed', async () => {
  const imageWithSignature = mockImage();
  imageWithSignature.url =
    'https://example.com/image.jpg?quality=52&sig=7Qm1DF&format=webp';

  const articles = [
    mockArticle({
      id: '1',
      latest: {
        __typename: 'ArticleRevision',
        id: '1',
        publishedAt: new Date('2023-01-01').toISOString(),
        createdAt: new Date('2023-01-01').toISOString(),
        blocks: [],
        authors: [mockAuthor()],
        properties: [],
        image: imageWithSignature,
        lead: 'Test lead',
        title: 'Test title',
        preTitle: 'Test pretitle',
        socialMediaDescription: 'Test social media description',
        socialMediaImage: imageWithSignature,
        socialMediaTitle: 'Test social media title',
        canonicalUrl: 'https://example.com',
      },
    }),
  ] as Article[];

  const rss = (await generate(articles)).rss2();

  expect(rss).toContain('&amp;sig=');
  expect(rss).toContain('&amp;format=');
});
