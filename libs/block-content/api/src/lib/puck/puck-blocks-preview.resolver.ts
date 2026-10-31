import { ForbiddenException } from '@nestjs/common';
import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { CanCreateArticle, CanCreatePage } from '@wepublish/permissions';
import {
  hasPermission,
  permissionsOf,
  PreviewMode,
} from '@wepublish/permissions/api';
import { skipAnswerCache } from '@wepublish/public-content-cache/api';
import {
  parsePuckDocument,
  PuckBlockInput,
  PuckBlocksPreview,
  PuckRegistry,
} from '@wepublish/puck-content/api';

import { PuckBlockDataLoader } from './puck-block-data.loader';

const canEditPuckBlocks = (user: UserSession | undefined) => {
  const permissions = permissionsOf(user);

  return (
    hasPermission(CanCreateArticle, permissions) ||
    hasPermission(CanCreatePage, permissions)
  );
};

@Resolver()
export class PuckBlocksPreviewResolver {
  constructor(private puckBlockData: PuckBlockDataLoader) {}

  @Authenticated()
  @Query(() => PuckBlocksPreview, {
    description:
      'Reads unsaved Puck blocks and registry exactly as a saved revision would read them, without saving anything: hidden blocks included, unpublished records only in preview mode. For users who can create articles or pages.',
  })
  puckBlocksPreview(
    @Args('puckBlocks', { type: () => [PuckBlockInput] })
    puckBlocks: PuckBlockInput[],
    @Args('puckRegistry', { type: () => PuckRegistry, nullable: true })
    puckRegistry: PuckRegistry | null | undefined,
    @CurrentUser() user: UserSession | undefined,
    @Context() context: object,
    @PreviewMode() isPreview: boolean
  ): PuckBlocksPreview {
    if (!canEditPuckBlocks(user)) {
      throw new ForbiddenException(
        'Previewing Puck blocks needs the permission to create articles or pages.'
      );
    }

    skipAnswerCache(context);

    const { blocks, registry } = parsePuckDocument({
      blocks: puckBlocks,
      registry: puckRegistry,
    });

    return {
      puckBlocks: this.puckBlockData.flatten(blocks, {
        pruned: false,
        now: new Date(),
        preview: isPreview,
      }),
      puckRegistry: registry,
    };
  }
}
