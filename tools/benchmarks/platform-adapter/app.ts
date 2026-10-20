import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common';

const PAYLOAD = Array.from({ length: 200 }, (_, i) => ({
  id: `article-${i}`,
  title: `An article title number ${i}`,
  slug: `an-article-title-number-${i}`,
  publishedAt: '2026-10-16T00:00:00.000Z',
  tags: ['news', 'politics', 'local'],
  summary:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
}));

@Controller()
export class BenchController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('articles/:id')
  article(@Param('id') id: string) {
    return { id, title: `Article ${id}`, publishedAt: '2026-10-16T00:00:00.000Z' };
  }

  @Post('echo')
  echo(@Body() body: unknown) {
    return body;
  }

  @Get('payload')
  payload() {
    return PAYLOAD;
  }
}

@Module({ controllers: [BenchController] })
export class AppModule {}
