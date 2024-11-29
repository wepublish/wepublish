import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Page} from '../page.model'

@InterfaceType()
export abstract class HasPage {
  @Field(() => ID, {nullable: true})
  pageID?: string

  @Field(() => Page, {nullable: true})
  page?: Page
}
