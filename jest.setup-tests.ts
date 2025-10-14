import fetch from 'cross-fetch';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

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

  if (
    typeof message === 'object' &&
    'message' in message &&
    typeof message.message === 'string'
  ) {
    // JSDOM doesn't always support every new CSS property (e.g. container queries)
    // This hides the console.error from it.
    if (message.message.match(/.*Could not parse CSS stylesheet/gi)) {
      return;
    }
  }

  originalConsoleError(message, ...optionalParams);
};

if (global.fetch === undefined) {
  global.fetch = fetch;
}
