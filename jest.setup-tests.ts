import fetch from 'cross-fetch'

const originalConsoleError = console.error
const originalConsoleWarn = console.warn

global.console.error = (message, ...optionalParams) => {
  if (typeof message === 'string') {
    // GraphQL mocks might not contain every property that the schema specifies.
    // Apollo spams our console with it while not on production, this hides it.
    if (message.match(/Missing field '.*' while writing result/gi)) {
      return
    }

    if (
      message.match(
        /Warning: The current testing environment is not configured to support act(...)/gi
      )
    ) {
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

global.console.warn = (message, ...optionalParams) => {
  if (typeof message === 'string') {
    // GraphQL mocks might not contain every property that the schema specifies.
    // Apollo spams our console with it while not on production, this hides it.
    if (message.match(/Missing field '.*' while writing result/gi)) {
      return
    }

    // Tests may overlap and define the same fragments, not an issue during testing
    if (message.match(/Warning: fragment with name .* already exists./gi)) {
      return
    }
  }

  if (typeof message === 'object' && 'message' in message && typeof message.message === 'string') {
  }

  originalConsoleWarn(message, ...optionalParams)
}

if (global.fetch === undefined) {
  global.fetch = fetch
}
