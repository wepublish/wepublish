import type { UserSession } from '@wepublish/authentication/api';

import { PuckBlockDataLoader } from './puck-block-data.loader';
import { PuckBlockResolver } from './puck-block.resolver';

describe('PuckBlockResolver', () => {
  it('asks the loader for the records of the block, for the reader of the request', async () => {
    const data = { articles: [], pages: null };
    const loader = {
      data: vi.fn(async () => data),
    } as unknown as PuckBlockDataLoader;
    const block = { id: 'grid-1' };
    const user = { id: 'session' } as UserSession;
    const context = {};

    expect(
      await new PuckBlockResolver(loader).data(block as never, user, context)
    ).toBe(data);
    expect(loader.data).toHaveBeenCalledWith(block, { user, context });
  });
});
