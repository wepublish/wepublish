import { Field, InterfaceType } from '@nestjs/graphql';

import { PuckBlock } from './puck-block.model';
import { ApiBlock } from './puck-blocks';

@InterfaceType()
export class HasPuckBlocks {
  @Field(() => [PuckBlock], { nullable: true })
  puckBlocks?: ApiBlock[] | null;
}
