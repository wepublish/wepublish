import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {ArticleRevision} from './article.model'
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
  Author
} from '@wepublish/author/api'
import {Image, ImageDataloaderService} from '@wepublish/image/api'
import {ArticlePropertyDataloader, Property} from '@wepublish/property/api'
import {CurrentUser, UserSession} from '@wepublish/authentication/api'
import {CanGetArticle} from '@wepublish/permissions'
import {hasPermission} from '@wepublish/permissions/api'

@Resolver(() => ArticleRevision)
export class ArticleRevisionResolver {
  constructor(
    private authorDataLoader: ArticleAuthorDataloader,
    private socialMediaAuthorDataLoader: ArticleSocialMediaAuthorDataloader,
    private imageDataloaderService: ImageDataloaderService,
    private propertyDataLoader: ArticlePropertyDataloader
  ) {}

  @ResolveField(() => [Property])
  public async properties(
    @Parent() revision: ArticleRevision,
    @CurrentUser() user: UserSession | undefined
  ) {
    const properties = await this.propertyDataLoader.load(revision.id)

    return properties?.filter(
      prop => prop.public || hasPermission(CanGetArticle, user?.roles ?? [])
    )
  }

  @ResolveField(() => [Author])
  public async socialMediaAuthors(@Parent() revision: ArticleRevision) {
    return this.socialMediaAuthorDataLoader.load(revision.id)
  }

  @ResolveField(() => [Author])
  public async authors(@Parent() revision: ArticleRevision) {
    return this.authorDataLoader.load(revision.id)
  }

  @ResolveField(() => Image, {nullable: true})
  public async image(@Parent() revision: ArticleRevision) {
    const {imageID} = revision

    if (!imageID) {
      return null
    }

    return this.imageDataloaderService.load(imageID)
  }

  @ResolveField(() => Image, {nullable: true})
  public socialMediaImage(@Parent() revision: ArticleRevision) {
    const {socialMediaImageID} = revision

    if (!socialMediaImageID) {
      return null
    }

    return this.imageDataloaderService.load(socialMediaImageID)
  }
}
