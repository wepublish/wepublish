import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Page} from '../page.model'

@InterfaceType()
export abstract class HasOptionalPage {
  @Field(() => ID, {nullable: true})
  pageID?: string

  @Field(() => Page, {nullable: true})
  page?: Page
}

@InterfaceType()
export abstract class HasPage {
  @Field(() => ID)
  pageID!: string

  @Field(() => Page)
  page!: Page
}

// New Style

@InterfaceType()
export abstract class HasPageLc {
  @Field(() => ID)
  pageId!: string

  @Field(() => Page)
  page!: Page
}

@InterfaceType()
export abstract class HasOptionalPageLc {
  @Field(() => ID, {nullable: true})
  pageId?: string

  @Field(() => Page, {nullable: true})
  page?: Page
}
