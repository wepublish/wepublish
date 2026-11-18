import {
  ApiTokenSession,
  AuthSessionType,
  TokenSession,
} from '@wepublish/authentication/api';
import { ArticleResolver } from './article.resolver';

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

describe('ArticleResolver called with an api key or a peering token', () => {
  const articleService = {
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    duplicateArticle: vi.fn(),
    restoreArticleRevision: vi.fn(),
  };
  const resolver = new ArticleResolver(
    {} as any,
    {} as any,
    articleService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );

  it.each([
    ['an api key', apiKey, 'creator-1'],
    ['a peering token', peeringToken, undefined],
  ])('records who did the work for %s', async (_, session, userId) => {
    await resolver.createArticle({} as any, session);
    await resolver.updateArticle({} as any, session);
    await resolver.duplicateArticle('article-1', session);
    await resolver.restoreArticleRevision('article-1', 'revision-1', session);

    expect(articleService.createArticle).toHaveBeenLastCalledWith({}, userId);
    expect(articleService.updateArticle).toHaveBeenLastCalledWith({}, userId);
    expect(articleService.duplicateArticle).toHaveBeenLastCalledWith(
      'article-1',
      userId
    );
    expect(articleService.restoreArticleRevision).toHaveBeenLastCalledWith(
      'article-1',
      'revision-1',
      userId
    );
  });
});
