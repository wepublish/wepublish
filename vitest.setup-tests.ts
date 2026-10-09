import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

process.env['TZ'] = 'UTC';
// nx loads .env into every task; tests must not share the dev Dragonfly.
delete process.env['REDIS_URL'];
delete process.env['REDIS_KEY_PREFIX'];

loadDevMessages();
loadErrorMessages();

const originalConsoleError = console.error;

global.console.error = (message, ...optionalParams) => {
  if (typeof message === 'string') {
    if (
      message.match(
        /Warning: The current testing environment is not configured to support act(...)/gi
      )
    ) {
      return;
    }
  }

  originalConsoleError(message, ...optionalParams);
};
