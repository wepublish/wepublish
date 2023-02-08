import {trackPage} from './analytics'

jest.mock('matomo-tracker', () => {
  return {
    MatomoTracker: jest.fn().mockImplementation(() => {
      return {}
    })
  }
})

describe('analytics', () => {
  it('should work', () => {
    expect(typeof trackPage).toBe('function')
  })
})
