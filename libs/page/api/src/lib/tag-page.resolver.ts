import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Tag as PTag } from '@prisma/client';
import { PreviewMode } from '@wepublish/permissions/api';
import { Tag } from '@wepublish/tag/api';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';

@Resolver(() => Tag)
export class TagPageResolver {
  constructor(private revisions: PageRevisionDataloaderService) {}

  @ResolveField()
  async pageId(@Parent() tag: PTag, @PreviewMode() isPreview: boolean) {
    if (!tag.pageId || isPreview) {
      return tag.pageId ?? null;
    }

    const { published } = await this.revisions.load(tag.pageId);

    return published ? tag.pageId : null;
  }
}
