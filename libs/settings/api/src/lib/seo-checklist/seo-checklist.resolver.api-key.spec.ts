import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { SeoChecklistResolver } from './seo-checklist.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('SeoChecklistResolver called with an api key', () => {
  it('records the key‘s creator as having done the item', async () => {
    const seoChecklistService = { updateItem: vi.fn() };
    const resolver = new SeoChecklistResolver(seoChecklistService as any);

    await resolver.updateSeoChecklistItem(
      { itemId: 'gsc-verify', completed: true },
      apiKey
    );

    expect(seoChecklistService.updateItem).toHaveBeenCalledWith(
      'gsc-verify',
      true,
      'creator-1'
    );
  });
});
