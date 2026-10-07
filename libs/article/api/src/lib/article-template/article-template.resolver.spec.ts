import { NotFoundException } from '@nestjs/common';
import {
  CanCreateArticle,
  CanCreateArticleTemplate,
  CanDeleteArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { BlockTemplateDataloaderService } from '@wepublish/block-content/api';
import { AuthorDataloaderService } from '@wepublish/author/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { TagDataloader } from '@wepublish/tag/api';
import {
  ArticleTemplateMetadataResolver,
  ArticleTemplateResolver,
} from './article-template.resolver';
import { ArticleTemplateMetadataInput } from '../article.model';
import { ArticleTemplateService } from './article-template.service';

const metadata: ArticleTemplateMetadataInput = {
  preTitle: 'Pre Title',
  title: 'Title',
  lead: 'Lead',
  breaking: true,
  hideAuthor: false,
  shared: false,
  hidden: false,
  disableComments: true,
  paywallId: 'paywall',
  imageID: 'image',
  socialMediaImageID: 'social-image',
  tagIds: ['tag1', 'missing-tag'],
  authors: [
    { authorId: 'author1', role: 'Photos' },
    { authorId: 'missing-author' },
  ],
  socialMediaAuthorIds: ['author1', 'missing-author'],
  properties: [{ key: 'key', value: 'value', public: true }],
};

const articleTemplate = {
  id: '1',
  createdAt: new Date(),
  modifiedAt: new Date(),
  blockTemplateId: 'block-template',
  metadata,
};

describe('ArticleTemplateResolver', () => {
  let service: Record<string, jest.Mock>;
  let blockTemplateDataloader: { load: jest.Mock };
  let resolver: ArticleTemplateResolver;

  beforeEach(() => {
    service = {
      getArticleTemplates: jest.fn(),
      getArticleTemplateById: jest.fn().mockResolvedValue(articleTemplate),
      createArticleTemplate: jest.fn(),
      updateArticleTemplate: jest.fn(),
      deleteArticleTemplate: jest.fn(),
    };
    blockTemplateDataloader = {
      load: jest.fn().mockResolvedValue({ id: 'block-template' }),
    };

    resolver = new ArticleTemplateResolver(
      service as unknown as ArticleTemplateService,
      blockTemplateDataloader as unknown as BlockTemplateDataloaderService
    );
  });

  it('should return an article template by id', async () => {
    expect(await resolver.articleTemplate('1')).toBe(articleTemplate);
  });

  it('should throw if an article template does not exist', async () => {
    service['getArticleTemplateById'].mockResolvedValue(null);

    await expect(resolver.articleTemplate('1')).rejects.toThrow(
      NotFoundException
    );
  });

  it('should delegate mutations to the service', async () => {
    const input = { name: 'Template', blocks: [], metadata };

    await resolver.createArticleTemplate(input);
    await resolver.updateArticleTemplate({ id: '1', ...input });
    await resolver.deleteArticleTemplate('1');

    expect(service['createArticleTemplate']).toHaveBeenCalledWith(input);
    expect(service['updateArticleTemplate']).toHaveBeenCalledWith({
      id: '1',
      ...input,
    });
    expect(service['deleteArticleTemplate']).toHaveBeenCalledWith('1');
  });

  it('should resolve the content of a deleted article template', async () => {
    const blockTemplate = { id: 'block-template', name: 'Deleted' };

    expect(
      await resolver.blockTemplate({
        ...articleTemplate,
        blockTemplate,
      } as never)
    ).toBe(blockTemplate);
    expect(blockTemplateDataloader.load).not.toHaveBeenCalled();
  });

  it('should resolve the content of an article template', async () => {
    expect(await resolver.blockTemplate(articleTemplate)).toEqual({
      id: 'block-template',
    });
    expect(blockTemplateDataloader.load).toHaveBeenCalledWith('block-template');
  });
});

describe('ArticleTemplateResolver permissions', () => {
  const permissionsOf = (method: keyof ArticleTemplateResolver) =>
    Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      ArticleTemplateResolver.prototype[method]
    );

  it.each([
    ['articleTemplates', CanCreateArticle],
    ['articleTemplate', CanCreateArticle],
    ['createArticleTemplate', CanCreateArticleTemplate],
    ['updateArticleTemplate', CanUpdateArticleTemplate],
    ['deleteArticleTemplate', CanDeleteArticleTemplate],
  ] as const)('should require %s to be permitted', (method, permission) => {
    expect(permissionsOf(method)).toEqual([permission]);
  });
});

describe('ArticleTemplateMetadataResolver', () => {
  let resolver: ArticleTemplateMetadataResolver;
  const author = { id: 'author1', name: 'Author' };
  const tag = { id: 'tag1', tag: 'Tag' };
  const image = { id: 'image' };

  beforeEach(() => {
    resolver = new ArticleTemplateMetadataResolver(
      {
        load: jest.fn(async (id: string) => (id === author.id ? author : null)),
      } as unknown as AuthorDataloaderService,
      {
        load: jest.fn(async (id: string) => (id === tag.id ? tag : null)),
      } as unknown as TagDataloader,
      {
        load: jest.fn(async (id: string) => (id === image.id ? image : null)),
      } as unknown as ImageDataloaderService
    );
  });

  it('should resolve existing tags and drop missing ones', async () => {
    expect(await resolver.tags(metadata)).toEqual([tag]);
  });

  it('should resolve existing authors with their role and drop missing ones', async () => {
    expect(await resolver.authors(metadata)).toEqual([
      { author, role: 'Photos' },
    ]);
  });

  it('should resolve existing social media authors and drop missing ones', async () => {
    expect(await resolver.socialMediaAuthors(metadata)).toEqual([author]);
  });

  it('should resolve images', async () => {
    expect(await resolver.image(metadata)).toEqual(image);
    expect(await resolver.socialMediaImage(metadata)).toBeNull();
    expect(
      await resolver.image({ ...metadata, imageID: undefined })
    ).toBeNull();
  });
});
