import type { Mock } from 'vitest';

import { NotFoundException } from '@nestjs/common';
import {
  CanCreatePage,
  CanCreatePageTemplate,
  CanDeletePageTemplate,
  CanUpdatePageTemplate,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { BlockTemplateDataloaderService } from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { TagDataloader } from '@wepublish/tag/api';
import {
  PageTemplateMetadataResolver,
  PageTemplateResolver,
} from './page-template.resolver';
import { PageTemplateMetadataInput } from '../page.model';
import { PageTemplateService } from './page-template.service';

const metadata: PageTemplateMetadataInput = {
  title: 'Title',
  description: 'Description',
  hidden: false,
  imageID: 'image',
  socialMediaImageID: 'social-image',
  tagIds: ['tag1', 'missing-tag'],
  properties: [{ key: 'key', value: 'value', public: true }],
};

const pageTemplate = {
  id: '1',
  createdAt: new Date(),
  modifiedAt: new Date(),
  blockTemplateId: 'block-template',
  metadata,
};

describe('PageTemplateResolver', () => {
  let service: Record<string, Mock>;
  let blockTemplateDataloader: { load: Mock };
  let resolver: PageTemplateResolver;

  beforeEach(() => {
    service = {
      getPageTemplates: vi.fn(),
      getPageTemplateById: vi.fn().mockResolvedValue(pageTemplate),
      createPageTemplate: vi.fn(),
      updatePageTemplate: vi.fn(),
      deletePageTemplate: vi.fn(),
    };
    blockTemplateDataloader = {
      load: vi.fn().mockResolvedValue({ id: 'block-template' }),
    };

    resolver = new PageTemplateResolver(
      service as unknown as PageTemplateService,
      blockTemplateDataloader as unknown as BlockTemplateDataloaderService
    );
  });

  it('should return a page template by id', async () => {
    expect(await resolver.pageTemplate('1')).toBe(pageTemplate);
  });

  it('should throw if a page template does not exist', async () => {
    service['getPageTemplateById'].mockResolvedValue(null);

    await expect(resolver.pageTemplate('1')).rejects.toThrow(NotFoundException);
  });

  it('should delegate mutations to the service', async () => {
    const input = { name: 'Template', blocks: [], metadata };

    await resolver.createPageTemplate(input);
    await resolver.updatePageTemplate({ id: '1', ...input });
    await resolver.deletePageTemplate('1');

    expect(service['createPageTemplate']).toHaveBeenCalledWith(input);
    expect(service['updatePageTemplate']).toHaveBeenCalledWith({
      id: '1',
      ...input,
    });
    expect(service['deletePageTemplate']).toHaveBeenCalledWith('1');
  });

  it('should resolve the content of a deleted page template', async () => {
    const blockTemplate = { id: 'block-template', name: 'Deleted' };

    expect(
      await resolver.blockTemplate({
        ...pageTemplate,
        blockTemplate,
      } as never)
    ).toBe(blockTemplate);
    expect(blockTemplateDataloader.load).not.toHaveBeenCalled();
  });

  it('should resolve the content of a page template', async () => {
    expect(await resolver.blockTemplate(pageTemplate)).toEqual({
      id: 'block-template',
    });
    expect(blockTemplateDataloader.load).toHaveBeenCalledWith('block-template');
  });
});

describe('PageTemplateResolver permissions', () => {
  const permissionsOf = (method: keyof PageTemplateResolver) =>
    Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      PageTemplateResolver.prototype[method]
    );

  it.each([
    ['pageTemplates', CanCreatePage],
    ['pageTemplate', CanCreatePage],
    ['createPageTemplate', CanCreatePageTemplate],
    ['updatePageTemplate', CanUpdatePageTemplate],
    ['deletePageTemplate', CanDeletePageTemplate],
  ] as const)('should require %s to be permitted', (method, permission) => {
    expect(permissionsOf(method)).toEqual([permission]);
  });
});

describe('PageTemplateMetadataResolver', () => {
  let resolver: PageTemplateMetadataResolver;
  const tag = { id: 'tag1', tag: 'Tag' };
  const image = { id: 'image' };

  beforeEach(() => {
    resolver = new PageTemplateMetadataResolver(
      {
        load: vi.fn(async (id: string) => (id === tag.id ? tag : null)),
      } as unknown as TagDataloader,
      {
        load: vi.fn(async (id: string) => (id === image.id ? image : null)),
      } as unknown as ImageDataloaderService
    );
  });

  it('should resolve existing tags and drop missing ones', async () => {
    expect(await resolver.tags(metadata)).toEqual([tag]);
  });

  it('should resolve images', async () => {
    expect(await resolver.image(metadata)).toEqual(image);
    expect(await resolver.socialMediaImage(metadata)).toBeNull();
    expect(
      await resolver.image({ ...metadata, imageID: undefined })
    ).toBeNull();
  });
});
