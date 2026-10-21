import '@wepublish/utils/api/otel';
import './instrument';
import { createNestLogger } from '@wepublish/utils/api/otel/logger';
import { Logger } from '@nestjs/common';
import { bootstrap } from './bootstrap';

bootstrap({ logger: createNestLogger() }).then(({ port }) => {
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
});
