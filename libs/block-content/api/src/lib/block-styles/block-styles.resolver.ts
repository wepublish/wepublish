import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateBlockStyle,
  CanDeleteBlockStyle,
  CanUpdateBlockStyle,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Public } from '@wepublish/authentication/api';
import {
  BlockStyle,
  CreateBlockStyleInput,
  UpdateBlockStyleInput,
} from './block-styles.model';
import { BlockStylesService } from './block-styles.service';

@Resolver(() => BlockStyle)
export class BlockStylesResolver {
  constructor(private blockstylesService: BlockStylesService) {}

  @Public()
  @Query(returns => [BlockStyle], {
    description: `Returns a list of block styles.`,
  })
  public blockStyles() {
    return this.blockstylesService.getBlockStyles();
  }

  @Permissions(CanCreateBlockStyle)
  @Mutation(returns => BlockStyle, {
    description: `Creates a new block style.`,
  })
  public createBlockStyle(@Args() blockstyles: CreateBlockStyleInput) {
    return this.blockstylesService.createBlockStyle(blockstyles);
  }

  @Permissions(CanUpdateBlockStyle)
  @Mutation(returns => BlockStyle, {
    description: `Updates an existing block style.`,
  })
  public updateBlockStyle(@Args() blockstyles: UpdateBlockStyleInput) {
    return this.blockstylesService.updateBlockStyle(blockstyles);
  }

  @Permissions(CanDeleteBlockStyle)
  @Mutation(returns => BlockStyle, {
    description: `Deletes an existing block style.`,
  })
  public deleteBlockStyle(@Args('id') id: string) {
    return this.blockstylesService.deleteBlockStyle(id);
  }
}
