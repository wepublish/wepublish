import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {ArticleDataloaderService} from './article-dataloader.service'
import {ArticleRevision, Property} from './article.model'
import {Author} from '@wepublish/author/api'
import {Image} from '@wepublish/image/api'
import {ArticleRevisionService} from './article-revision.service'

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    private articleDataloader: ArticleDataloaderService,
    private revisionService: ArticleRevisionService
  ) {}

  @Query(() => ArticleRevision, {description: `Returns an article revision by id.`})
  public getArticle(@Args('id') id: string) {
    return this.articleDataloader.load(id)
  }

  @ResolveField(() => [Property])
  public async properties(@Parent() revision: ArticleRevision) {
    return this.revisionService.getProperties(revision.id)
  }

  @ResolveField(() => [Author])
  public async socialMediaAuthors(@Parent() revision: ArticleRevision) {
    const authors = await this.revisionService.getSocialMediaAuthors(revision.id)

    return authors.map(({id}) => ({__typename: 'Author', id}))
  }

  @ResolveField(() => [Author])
  public async authors(@Parent() revision: ArticleRevision) {
    const authors = await this.revisionService.getAuthors(revision.id)

    return authors.map(({id}) => ({__typename: 'Author', id}))
  }

  @ResolveField(() => Image, {nullable: true})
  public async image(@Parent() revision: ArticleRevision) {
    const {imageID} = revision

    if (!imageID) {
      return null
    }

    return {__typename: 'Image', id: imageID}
  }

  @ResolveField(() => Image, {nullable: true})
  public socialMediaImage(@Parent() revision: ArticleRevision) {
    const {socialMediaImageID} = revision

    if (!socialMediaImageID) {
      return null
    }

    return {__typename: 'Image', id: socialMediaImageID}
  }
}
