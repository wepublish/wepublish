import { type FullAuthorFragment, TagType } from '@wepublish/editor/api';
import { imageFixture, tagFixture } from '@wepublish/form/editor/testing';
import type { RichtextJSONDocument } from '@wepublish/richtext';

import {
  type AuthorFormOutput,
  fromAuthor,
  toCreateAuthorVariables,
  toUpdateAuthorVariables,
} from './author.schema';

const portrait = imageFixture('image-portrait', 'Portrait');
const science = tagFixture('tag-science', 'Wissenschaft', TagType.Author);

const bio: RichtextJSONDocument = {
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text: 'Pionierin' }],
    },
  ],
};

const author: FullAuthorFragment = {
  __typename: 'Author',
  id: 'author-1',
  name: 'Ada Lovelace',
  slug: 'ada',
  jobTitle: null,
  bio: null,
  url: 'https://example.com/author/ada',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  imageID: 'image-portrait',
  image: portrait,
  hideOnArticle: true,
  hideOnTeaser: false,
  hideOnTeam: true,
  peer: null,
  links: [
    {
      __typename: 'AuthorLink',
      title: 'Website',
      url: 'https://ada.example.com',
    },
  ],
  tags: [science],
};

const emptyValues: AuthorFormOutput = {
  name: 'Ada Lovelace',
  slug: 'ada-lovelace',
  jobTitle: '',
  image: null,
  bio: null,
  links: [],
  tagIds: [],
  hideOnArticle: false,
  hideOnTeaser: false,
  hideOnTeam: false,
};

describe('author schema mappings', () => {
  it('loads links without their typename, tags as ids and a missing job title as empty', () => {
    expect(fromAuthor(author)).toStrictEqual({
      name: 'Ada Lovelace',
      slug: 'ada',
      jobTitle: '',
      image: portrait,
      bio: null,
      links: [{ title: 'Website', url: 'https://ada.example.com' }],
      tagIds: ['tag-science'],
      hideOnArticle: true,
      hideOnTeaser: false,
      hideOnTeam: true,
    });
  });

  it('leaves an empty bio and a missing image out of a create', () => {
    expect(toCreateAuthorVariables(emptyValues)).toStrictEqual({
      name: 'Ada Lovelace',
      slug: 'ada-lovelace',
      jobTitle: '',
      bio: undefined,
      imageID: undefined,
      links: [],
      tagIds: [],
      hideOnArticle: false,
      hideOnTeaser: false,
      hideOnTeam: false,
    });
  });

  it('clears an emptied bio and a removed image on update', () => {
    expect(toUpdateAuthorVariables('author-1', emptyValues)).toStrictEqual({
      id: 'author-1',
      name: 'Ada Lovelace',
      slug: 'ada-lovelace',
      jobTitle: '',
      bio: null,
      imageID: null,
      links: [],
      tagIds: [],
      hideOnArticle: false,
      hideOnTeaser: false,
      hideOnTeam: false,
    });
  });

  it('sends the bio and the image id when present', () => {
    const values = { ...emptyValues, bio, image: portrait };

    expect(toCreateAuthorVariables(values)).toMatchObject({
      bio,
      imageID: 'image-portrait',
    });
    expect(toUpdateAuthorVariables('author-1', values)).toMatchObject({
      bio,
      imageID: 'image-portrait',
    });
  });
});
