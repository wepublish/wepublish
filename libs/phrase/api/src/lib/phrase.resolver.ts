import {Args, Query, Resolver} from '@nestjs/graphql'
import {Phrase, PhraseQueryArgs} from './phrase.model'
import {PhraseService} from './phrase.service'

@Resolver(() => Phrase)
export class PhraseResolver {
  constructor(private phraseService: PhraseService) {}

  @Query(() => Phrase, {
    description:
      'This query performs a fulltext search on titles and blocks of articles/phrases and returns all matching ones.'
  })
  public phrase(@Args() phraseArgs: PhraseQueryArgs) {
    return this.phraseService.queryPhrase(phraseArgs)
  }
}
