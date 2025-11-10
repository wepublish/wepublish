import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { BaseBlock } from './base-block.model';
import { BlockStylesDataloaderService } from './block-styles/block-styles-dataloader.service';

@Resolver(() => BaseBlock)
export class BaseBlockResolver {
  constructor(private blockStyles: BlockStylesDataloaderService) {}

  @ResolveField(() => String, { nullable: true })
  async blockStyleName(@Parent() block: BaseBlock<any>) {
    if (!block.blockStyle) {
      return null;
    }

    const blockStyleName = (await this.blockStyles.load(block.blockStyle))
      ?.name;

    return blockStyleName;
  }
}
