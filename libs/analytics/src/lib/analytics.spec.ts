import {trackPage} from './analytics'

describe('analytics', () => {
  it('should work', () => {
    expect(typeof trackPage).toBe('function')
  })
})
