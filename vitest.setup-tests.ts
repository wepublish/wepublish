import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

process.env['TZ'] = 'UTC';
// nx loads .env into every task; tests must not share the dev Dragonfly.
delete process.env['REDIS_URL'];
delete process.env['REDIS_KEY_PREFIX'];

loadDevMessages();
loadErrorMessages();
