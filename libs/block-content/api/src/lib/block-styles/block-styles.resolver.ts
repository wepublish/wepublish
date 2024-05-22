import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  CanCreateBlockStyle,
  CanDeleteBlockStyle,
  CanUpdateBlockStyle,
  Permissions
} from '@wepublish/permissions/api'
import {BlockStyle, CreateBlockStyleInput, UpdateBlockStyleInput} from './block-styles.model'
import {BlockStylesService} from './block-styles.service'

@Resolver(() => BlockStyle)
export class BlockStylesResolver {
  constructor(private blockstylesService: BlockStylesService) {}

  @Query(returns => [BlockStyle], {
    description: `Returns a list of block styles.`
  })
  public blockStyles() {
    return this.blockstylesService.getBlockStyles()
  }

  @Mutation(returns => BlockStyle, {description: `Creates a new block style.`})
  @Permissions(CanCreateBlockStyle)
  public createBlockStyle(@Args() blockstyles: CreateBlockStyleInput) {
    return this.blockstylesService.createBlockStyle(blockstyles)
  }

  @Mutation(returns => BlockStyle, {description: `Updates an existing block style.`})
  @Permissions(CanUpdateBlockStyle)
  public updateBlockStyle(@Args() blockstyles: UpdateBlockStyleInput) {
    return this.blockstylesService.updateBlockStyle(blockstyles)
  }

  @Mutation(returns => BlockStyle, {description: `Deletes an existing block style.`})
  @Permissions(CanDeleteBlockStyle)
  public deleteBlockStyle(@Args('id') id: string) {
    return this.blockstylesService.deleteBlockStyle(id)
  }
}
