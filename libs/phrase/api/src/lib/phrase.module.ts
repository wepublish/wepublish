import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PhraseResolver } from './phrase.resolver';
import { PhraseService } from './phrase.service';
import { ArticleModule } from '@wepublish/article/api';
import { PageModule } from '@wepublish/page/api';

@Module({
  imports: [PrismaModule, ArticleModule, PageModule],
  providers: [PhraseService, PhraseResolver],
  exports: [PhraseService],
})
export class PhraseModule {}
