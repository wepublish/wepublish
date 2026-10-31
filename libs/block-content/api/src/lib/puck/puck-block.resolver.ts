import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';
import { FlatPuckBlock, PuckBlock } from '@wepublish/puck-content/api';

import { PuckBlockDataLoader } from './puck-block-data.loader';
import { PuckBlockData } from './puck-block-data.model';

@Resolver(() => PuckBlock)
export class PuckBlockResolver {
  constructor(private puckBlockData: PuckBlockDataLoader) {}

  @ResolveField(() => PuckBlockData, {
    description: 'The records the datasources of this block yield.',
  })
  data(
    @Parent() block: FlatPuckBlock,
    @CurrentUser() user: UserSession | undefined,
    @Context() context: object
  ): Promise<PuckBlockData> {
    return this.puckBlockData.data(block, { user, context });
  }
}
