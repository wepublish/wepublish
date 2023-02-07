import {wepublish} from './analytics'

describe('analytics', () => {
  it('should work', () => {
    expect(wepublish()['name']).toEqual('wp-analytics')
  })
})
