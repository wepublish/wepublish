const originalConsoleError = console.error

global.console.error = (message, ...optionalParams) => {
  if (typeof message === 'string') {
    // GraphQL mocks might not contain every property that the schema specifies.
    // Apollo spams our console with it while not on production, this hides it.
    if (message.match(/Missing field '.*' while writing result/gi)) {
      return
    }
  }

  if (typeof message === 'object' && 'message' in message && typeof message.message === 'string') {
    // JSDOM doesn't always support every new CSS property (e.g. container queries)
    // This hides the console.error from it.
    if (message.message.match(/.*Could not parse CSS stylesheet/gi)) {
      return
    }
  }

  originalConsoleError(message, ...optionalParams)
}
