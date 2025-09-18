import { Field, InterfaceType } from '@nestjs/graphql';
import { Page } from '../page.model';

@InterfaceType()
export abstract class HasOptionalPage {
  @Field({ nullable: true })
  pageID?: string;

  @Field(() => Page, { nullable: true })
  page?: Page;
}

@InterfaceType()
export abstract class HasPage {
  @Field()
  pageID!: string;

  @Field(() => Page)
  page!: Page;
}

// New Style

@InterfaceType()
export abstract class HasPageLc {
  @Field()
  pageId!: string;

  @Field(() => Page)
  page!: Page;
}

@InterfaceType()
export abstract class HasOptionalPageLc {
  @Field({ nullable: true })
  pageId?: string;

  @Field(() => Page, { nullable: true })
  page?: Page;
}
