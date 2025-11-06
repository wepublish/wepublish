import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

import { BaseBlock } from './base-block.model';
import { BlockStylesDataloaderService } from './block-styles/block-styles-dataloader.service';

@Resolver(() => BaseBlock)
export class BaseBlockResolver {
  constructor(private blockStyles: BlockStylesDataloaderService) {
    //console.log('base-block.resolver.ts - Initialized BaseBlockResolver');
  }

  @ResolveField(() => String, { nullable: true })
  async blockStyleName(@Parent() block: BaseBlock<any>) {
    /*
    console.log(
      'base-block.resolver.ts - Resolving blockStyleName for block:',
      block.type
    );
    */
    if (!block.blockStyle) {
      //console.log('No blockStyle defined for block:', block.type);
      return null;
    }

    const blockStyleName = (await this.blockStyles.load(block.blockStyle))
      ?.name;

    //console.log('Resolved blockStyleName:', blockStyleName, 'for block:', block.type);
    return blockStyleName;
  }
}
