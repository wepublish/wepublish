import { Field, InterfaceType } from '@nestjs/graphql';

import { PuckBlock } from './puck-block.model';
import { ApiBlock, ApiPuckRegistry } from './puck-blocks';
import { PuckRegistry } from './puck-registry.model';

@InterfaceType()
export class HasPuckBlocks {
  @Field(() => [PuckBlock], { nullable: true })
  puckBlocks?: ApiBlock[] | null;

  @Field(() => PuckRegistry, { nullable: true })
  puckRegistry?: ApiPuckRegistry | null;
}
