import { Module } from '@nestjs/common';
import { ArticlePropertyDataloader } from './article-property.dataloader';
import { PagePropertyDataloader } from './page-property.dataloader';
import { UserPropertyDataloader } from './user-property.dataloader';
import { SubscriptionPropertyDataloader } from './subscription-property.dataloader';
import { PrismaModule } from '@wepublish/nest-modules';

@Module({
  imports: [PrismaModule],
  providers: [
    ArticlePropertyDataloader,
    PagePropertyDataloader,
    UserPropertyDataloader,
    SubscriptionPropertyDataloader,
  ],
  exports: [
    ArticlePropertyDataloader,
    PagePropertyDataloader,
    UserPropertyDataloader,
    SubscriptionPropertyDataloader,
  ],
})
export class PropertyModule {}
