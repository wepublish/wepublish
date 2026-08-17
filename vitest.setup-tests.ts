import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

process.env['TZ'] = 'UTC';

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
