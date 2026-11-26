import { EngagementStageResolver } from './engagement-stage.resolver';

describe('EngagementStageResolver', () => {
  const template = { id: 'template', name: 'Newsletter box', blocks: [] };
  const resolver = new EngagementStageResolver(
    { load: vi.fn() } as never,
    {
      load: vi.fn(async (id: string) => (id === 'template' ? template : null)),
    } as never
  );

  it('answers the block template a stage shows instead of its texts', async () => {
    expect(
      await resolver.blockTemplate({ blockTemplateId: 'template' } as never)
    ).toBe(template);
    expect(
      await resolver.blockTemplate({ blockTemplateId: null } as never)
    ).toBeNull();
  });
});
