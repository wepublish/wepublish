import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ActionService } from './action.service';
import { PageModule } from '@wepublish/page/api';
import { PollModule } from '@wepublish/poll/api';
import { AuthorModule } from '@wepublish/author/api';
import { ArticleModule } from '@wepublish/article/api';
import { CommentModule } from '@wepublish/comments/api';
import { ActionResolver } from './action.resolver';

@Module({
  imports: [
    PrismaModule,
    PageModule,
    PollModule,
    AuthorModule,
    ArticleModule,
    CommentModule,
  ],
  providers: [ActionResolver, ActionService],
})
export class ActionModule {}
