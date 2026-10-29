import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BlockTiming } from './block-timing.model';
import { timingDate } from './block-timing';

@Resolver(() => BlockTiming)
export class BlockTimingResolver {
  @ResolveField(() => Date, {
    nullable: true,
    description: 'The block is hidden before this moment.',
  })
  from(@Parent() timing: BlockTiming) {
    return timingDate(timing.from);
  }

  @ResolveField(() => Date, {
    nullable: true,
    description: 'The block is hidden from this moment on.',
  })
  to(@Parent() timing: BlockTiming) {
    return timingDate(timing.to);
  }
}
