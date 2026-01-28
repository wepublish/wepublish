import { Args, Query, Resolver } from '@nestjs/graphql';
import { Phrase, PhraseQueryArgs } from './phrase.model';
import { PhraseService } from './phrase.service';
import { Public } from '@wepublish/authentication/api';

@Resolver(() => Phrase)
export class PhraseResolver {
  constructor(private phraseService: PhraseService) {}

  @Public()
  @Query(() => Phrase, {
    description:
      'This query performs a fulltext search on titles and blocks of articles/phrases and returns all matching ones.',
  })
  public phrase(@Args() phraseArgs: PhraseQueryArgs) {
    return this.phraseService.queryPhrase(phraseArgs);
  }
}
