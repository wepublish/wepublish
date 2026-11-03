import { Field, ObjectType } from '@nestjs/graphql';

import { PuckBlock } from './puck-block.model';
import { ApiPuckRegistry } from './puck-blocks';
import { FlatPuckBlock } from './puck-blocks-flatten';
import { PuckRegistry } from './puck-registry.model';

@ObjectType({
  description:
    'Unsaved Puck blocks and registry, read exactly as a saved revision would read them. Nothing is saved.',
})
export class PuckBlocksPreview {
  @Field(() => [PuckBlock])
  puckBlocks!: FlatPuckBlock[];

  @Field(() => PuckRegistry, { nullable: true })
  puckRegistry?: ApiPuckRegistry | null;
}
