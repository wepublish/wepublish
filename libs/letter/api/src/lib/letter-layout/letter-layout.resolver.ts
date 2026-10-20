import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateMailTemplates,
  CanDeleteMailTemplates,
  CanGetMailTemplates,
  CanUpdateMailTemplates,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  LetterLayoutInput,
  LetterLayoutModel,
  LetterLayoutPreviewInput,
  LetterLayoutPreviewModel,
} from './letter-layout.model';
import { LetterLayoutService } from './letter-layout.service';

/**
 * Stationery is maintained by whoever maintains the mail templates, so it
 * shares their permissions rather than adding a set of its own.
 */
@Resolver(() => LetterLayoutModel)
export class LetterLayoutResolver {
  constructor(private letterLayoutService: LetterLayoutService) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => [LetterLayoutModel], {
    description: 'All letter layouts, the default first.',
  })
  letterLayouts() {
    return this.letterLayoutService.list();
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterLayoutModel, { description: 'A single letter layout.' })
  letterLayout(@Args('id') id: string) {
    return this.letterLayoutService.findById(id);
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterLayoutPreviewModel, {
    description:
      'A sample letter printed on the given, possibly unsaved, stationery.',
  })
  letterLayoutPreview(@Args('input') input: LetterLayoutPreviewInput) {
    return this.letterLayoutService.preview(input);
  }

  @Permissions(CanCreateMailTemplates)
  @Mutation(() => LetterLayoutModel, { description: 'Create a letter layout.' })
  createLetterLayout(@Args('input') input: LetterLayoutInput) {
    return this.letterLayoutService.create(input);
  }

  @Permissions(CanUpdateMailTemplates)
  @Mutation(() => LetterLayoutModel, { description: 'Update a letter layout.' })
  updateLetterLayout(
    @Args('id') id: string,
    @Args('input') input: LetterLayoutInput
  ) {
    return this.letterLayoutService.update(id, input);
  }

  @Permissions(CanDeleteMailTemplates)
  @Mutation(() => LetterLayoutModel, {
    description:
      'Delete a letter layout. Refused while a mail template still prints on it.',
  })
  deleteLetterLayout(@Args('id') id: string) {
    return this.letterLayoutService.delete(id);
  }
}
