import { Logger } from '@nestjs/common';
import { bootstrap } from './bootstrap';
import './instrument';

bootstrap().then(({ port }) => {
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
});
