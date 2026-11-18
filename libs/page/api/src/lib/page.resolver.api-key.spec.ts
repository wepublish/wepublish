import {
  ApiTokenSession,
  AuthSessionType,
  TokenSession,
} from '@wepublish/authentication/api';
import { PageResolver } from './page.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

const peeringToken: TokenSession = {
  type: AuthSessionType.Token,
  id: 'peer-1',
  name: 'Import',
  token: 'secret',
  roles: [],
};

describe('PageResolver called with an api key or a peering token', () => {
  const pageService = {
    createPage: vi.fn(),
    updatePage: vi.fn(),
    duplicatePage: vi.fn(),
    restorePageRevision: vi.fn(),
  };
  const resolver = new PageResolver(
    {} as any,
    {} as any,
    pageService as any,
    {} as any,
    {} as any
  );

  it.each([
    ['an api key', apiKey, 'creator-1'],
    ['a peering token', peeringToken, undefined],
  ])('records who did the work for %s', async (_, session, userId) => {
    await resolver.createPage({} as any, session);
    await resolver.updatePage({} as any, session);
    await resolver.duplicatePage('page-1', session);
    await resolver.restorePageRevision('page-1', 'revision-1', session);

    expect(pageService.createPage).toHaveBeenLastCalledWith({}, userId);
    expect(pageService.updatePage).toHaveBeenLastCalledWith({}, userId);
    expect(pageService.duplicatePage).toHaveBeenLastCalledWith(
      'page-1',
      userId
    );
    expect(pageService.restorePageRevision).toHaveBeenLastCalledWith(
      'page-1',
      'revision-1',
      userId
    );
  });
});
