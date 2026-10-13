import { GateMode, LoginStatus } from '@prisma/client';
import { ArticleResolver } from './article.resolver';

describe('ArticleResolver', () => {
  describe('contentGate', () => {
    const gate = {
      id: 'gate-1',
      mode: GateMode.CONTENT_GATE,
      audience: LoginStatus.UNSUBSCRIBED,
      previewBlocks: 2,
      actions: [],
    };
    const contentGateAccess = { gateFor: vi.fn() };
    const resolver = new ArticleResolver(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      contentGateAccess as any
    );
    const article = { id: 'article-1', contentGateDisabled: false } as any;
    const session = { type: 'user' } as any;

    it('answers the gate that applies to the reader of this article', async () => {
      contentGateAccess.gateFor.mockResolvedValue(gate);

      await expect(
        resolver.contentGate(article, session)
      ).resolves.toMatchObject({
        id: 'gate-1',
        audience: 'NON_SUBSCRIBERS',
        previewBlocks: 2,
      });
      expect(contentGateAccess.gateFor).toHaveBeenCalledWith(article, session);
    });

    it('answers no gate when none applies', async () => {
      contentGateAccess.gateFor.mockResolvedValue(null);

      await expect(resolver.contentGate(article, session)).resolves.toBeNull();
    });
  });
});
